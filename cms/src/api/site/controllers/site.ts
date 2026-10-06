/**
 * site controller
 */

import { factories } from '@strapi/strapi';
import {
  createMultiPageStarter,
  createSinglePageStarter,
  slugifySiteKey,
  writeDeployPack,
  type SiteTemplate,
  type SiteTheme,
} from '../services/site-content';

const TEMPLATES: SiteTemplate[] = ['multi_page', 'single_page'];
const THEMES: SiteTheme[] = ['coastal', 'harbor', 'dune'];

function normalizeHostname(raw: string): string {
  return raw
    .split(',')[0]
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .replace(/:\d+$/, '');
}

export default factories.createCoreController('api::site.site', ({ strapi }) => ({
  /**
   * Resolve a published site by Host header value (no port).
   * GET /api/sites/resolve?host=www.example.com&locale=en
   */
  async resolve(ctx) {
    const hostRaw = String(ctx.query.host || ctx.request.header.host || '')
      .split(',')[0]
      .trim()
      .toLowerCase();
    const host = hostRaw.replace(/:\d+$/, '');
    const locale = typeof ctx.query.locale === 'string' ? ctx.query.locale : 'en';

    if (!host) {
      return ctx.badRequest('Missing host');
    }

    const sites = await strapi.documents('api::site.site').findMany({
      locale,
      status: 'published',
      populate: {
        logo: true,
        defaultSeo: {
          populate: ['ogImage'],
        },
      },
    });

    const match = (sites || []).find((site) => {
      const primary = String(site.hostname || '')
        .trim()
        .toLowerCase();
      if (primary === host) return true;
      const aliases = Array.isArray(site.hostnames)
        ? site.hostnames
        : typeof site.hostnames === 'string'
          ? (() => {
              try {
                return JSON.parse(site.hostnames);
              } catch {
                return String(site.hostnames)
                  .split(',')
                  .map((v: string) => v.trim());
              }
            })()
          : [];
      return aliases.some(
        (alias: unknown) => String(alias || '').trim().toLowerCase() === host,
      );
    });

    if (!match) {
      if (host === 'localhost' || host === '127.0.0.1') {
        const primary = (sites || []).find((site) => site.isPrimary);
        if (primary) {
          return { data: primary };
        }
      }
      return ctx.notFound('No site matches this host');
    }

    return { data: match };
  },

  /**
   * Provision a secondary site: CMS documents + deployment pack under sites/<key>/.
   * POST /api/sites/provision  (admin JWT required)
   * Body: { name, hostname, template, theme?, key? }
   */
  async provision(ctx) {
    const body = (ctx.request.body || {}) as Record<string, unknown>;
    const name = String(body.name || '').trim();
    const hostname = normalizeHostname(String(body.hostname || ''));
    const template = String(body.template || 'multi_page') as SiteTemplate;
    const theme = String(body.theme || 'coastal') as SiteTheme;
    const key = slugifySiteKey(String(body.key || name));

    if (!name) return ctx.badRequest('name is required');
    if (!hostname) return ctx.badRequest('hostname is required');
    if (!TEMPLATES.includes(template)) {
      return ctx.badRequest(`template must be one of: ${TEMPLATES.join(', ')}`);
    }
    if (!THEMES.includes(theme)) {
      return ctx.badRequest(`theme must be one of: ${THEMES.join(', ')}`);
    }

    const byKey = await strapi.documents('api::site.site').findMany({
      filters: { key },
      locale: 'en',
      limit: 1,
    });
    if (byKey.length > 0) {
      return ctx.throw(409, `Site key "${key}" already exists`);
    }

    const allSites = await strapi.documents('api::site.site').findMany({
      locale: 'en',
      limit: 200,
    });
    const hostTaken = (allSites || []).some((site) => {
      const primary = String(site.hostname || '')
        .trim()
        .toLowerCase();
      if (primary === hostname) return true;
      const aliases = Array.isArray(site.hostnames) ? site.hostnames : [];
      return aliases.some(
        (alias: unknown) => String(alias || '').trim().toLowerCase() === hostname,
      );
    });
    if (hostTaken) {
      return ctx.throw(409, `Hostname "${hostname}" is already used by another site`);
    }

    const siteName = name;
    const created = await strapi.documents('api::site.site').create({
      locale: 'en',
      data: {
        name,
        key,
        hostname,
        hostnames: [],
        isPrimary: false,
        template,
        theme,
        siteName,
        tagline: 'Coastal calm, curated stays',
        contactEmail: 'hello@example.com',
        contactPhone: '+1 000 000 0000',
        address: siteName,
        instagramUrl: 'https://www.instagram.com/',
        defaultSeo: {
          metaTitle: siteName,
          metaDescription: `${siteName} — coastal hospitality.`,
        },
      },
      status: 'published',
    });

    for (const locale of ['es', 'pt'] as const) {
      await strapi.documents('api::site.site').update({
        documentId: created.documentId,
        locale,
        data: {
          name,
          siteName,
          tagline:
            locale === 'es'
              ? 'Calma costera, estancias cuidadas'
              : 'Calma costeira, estadias selecionadas',
        },
        status: 'published',
      });
    }

    if (template === 'single_page') {
      await createSinglePageStarter(strapi, created.documentId, siteName);
    } else {
      await createMultiPageStarter(strapi, created.documentId, siteName);
    }

    const strapiPublicUrl =
      process.env.PUBLIC_URL ||
      `http://${process.env.HOST || 'localhost'}:${process.env.PORT || 1337}`;

    let pack;
    try {
      pack = writeDeployPack({
        key,
        hostname,
        theme,
        template,
        strapiPublicUrl,
      });
    } catch (error) {
      strapi.log.error('[provision] Failed to write deployment pack');
      strapi.log.error(error);
      return ctx.internalServerError(
        'Site was created in CMS but writing the deployment pack failed. Check SITES_ROOT permissions.',
      );
    }

    strapi.log.info(
      `[provision] Created site ${key} (${template}/${theme}) → port ${pack.port}`,
    );

    return {
      data: {
        site: {
          documentId: created.documentId,
          key,
          name,
          hostname,
          template,
          theme,
        },
        deployPack: {
          port: pack.port,
          dir: pack.dir,
          files: pack.files,
        },
        corsHint: `Add https://${hostname} (and http://localhost:${pack.port} for local) to FRONTEND_URLS in cms/.env, then restart Strapi.`,
      },
    };
  },
}));
