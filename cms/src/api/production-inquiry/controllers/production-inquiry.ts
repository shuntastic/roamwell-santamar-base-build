/**
 * production-inquiry controller
 */

import { factories } from '@strapi/strapi';
import { validateInquiry } from '../services/inquiry-fields';

const UID = 'api::production-inquiry.production-inquiry';

/** Submissions faster than this after the form renders are treated as bots. */
const MIN_FILL_MS = 3000;
const RATE_LIMIT = { max: 5, windowMs: 10 * 60 * 1000 };
const LOCALES = ['en', 'es', 'pt'];

const recentByIp = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (recentByIp.get(ip) ?? []).filter((at) => now - at < RATE_LIMIT.windowMs);
  if (recent.length >= RATE_LIMIT.max) {
    recentByIp.set(ip, recent);
    return true;
  }
  recent.push(now);
  recentByIp.set(ip, recent);

  if (recentByIp.size > 5000) {
    for (const [key, times] of recentByIp) {
      if (times.every((at) => now - at >= RATE_LIMIT.windowMs)) recentByIp.delete(key);
    }
  }
  return false;
}

function safeSourceUrl(raw: unknown): string | undefined {
  if (typeof raw !== 'string' || raw.length > 2000) return undefined;
  try {
    const url = new URL(raw);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

export default factories.createCoreController(UID, ({ strapi }) => ({
  /**
   * Public submission endpoint for the Production Inquiry Form block.
   * POST /api/production-inquiries/submit
   * Body: { formId, data, locale?, sourceUrl?, website? (honeypot), elapsedMs? }
   */
  async submit(ctx) {
    const body = (ctx.request.body || {}) as Record<string, unknown>;

    // Bots get a success response so they don't learn what tripped the filter.
    const honeypot = typeof body.website === 'string' && body.website.trim() !== '';
    const tooFast = typeof body.elapsedMs === 'number' && body.elapsedMs < MIN_FILL_MS;
    if (honeypot || tooFast) {
      ctx.status = 202;
      ctx.body = { ok: true };
      return;
    }

    if (isRateLimited(ctx.request.ip)) {
      return ctx.tooManyRequests('Too many submissions. Please try again later.');
    }

    const formId = Number(body.formId);
    if (!Number.isInteger(formId) || formId <= 0) {
      return ctx.badRequest('Missing form reference.');
    }

    const { data, errors } = validateInquiry(body.data);
    if (!data) {
      return ctx.badRequest('Please correct the highlighted fields.', { errors });
    }

    const service = strapi.service(UID);
    const recipients = await service.getFormRecipients(formId);
    if (!recipients) {
      return ctx.notFound('This form is no longer available.');
    }
    if (recipients.length === 0) {
      strapi.log.error(`[production-inquiry] Form ${formId} has no recipients configured.`);
      return ctx.internalServerError('This form is not accepting submissions right now.');
    }

    const locale = typeof body.locale === 'string' && LOCALES.includes(body.locale) ? body.locale : undefined;
    await service.submit(data, recipients, { sourceUrl: safeSourceUrl(body.sourceUrl), locale });

    ctx.status = 201;
    ctx.body = { ok: true };
  },
}));
