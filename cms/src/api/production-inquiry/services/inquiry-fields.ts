/**
 * Validation + email formatting for Production Inquiry submissions.
 * Field keys mirror `content-types/production-inquiry/schema.json` and the
 * frontend `ProductionInquiryFormBlock` payload.
 */

export const PRODUCTION_TYPES = [
  'commercial',
  'editorial',
  'film_tv',
  'corporate',
  'music_video',
  'other',
] as const;

export const FORMATS = ['still', 'motion', 'both'] as const;

export type ProductionType = (typeof PRODUCTION_TYPES)[number];
export type ProductionFormat = (typeof FORMATS)[number];

/** Codes are mapped to localized messages on the frontend. */
export type InquiryErrorCode = 'required' | 'invalid' | 'tooLong' | 'outOfRange' | 'beforeStart';

export type InquiryData = {
  name: string;
  company?: string;
  email: string;
  phone?: string;
  productionType: ProductionType;
  productionTypeOther?: string;
  shootDateStart: string;
  shootDateEnd?: string;
  prepStrikeDateStart?: string;
  prepStrikeDateEnd?: string;
  crewSize?: number;
  hoursNeeded?: number;
  format?: ProductionFormat;
  projectBrand?: string;
  vehicleCount?: number;
  details?: string;
};

type Errors = Partial<Record<keyof InquiryData, InquiryErrorCode>>;

const MAX_LENGTH = {
  name: 120,
  company: 160,
  email: 254,
  phone: 40,
  productionTypeOther: 80,
  projectBrand: 160,
  details: 5000,
} as const;

const EMAIL_PATTERN = /^[^\s@<>()[\],;:"]+@[^\s@<>()[\],;:"]+\.[^\s@<>()[\],;:"]+$/;
const PHONE_PATTERN = /^[+()\d\s.\-/]*(?:\s*(?:x|ext\.?)\s*\d+)?$/i;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function readText(
  raw: unknown,
  key: keyof typeof MAX_LENGTH,
  errors: Errors,
  { required = false, multiline = false } = {},
): string | undefined {
  const value =
    typeof raw === 'string'
      ? multiline
        ? raw.replace(/\r\n?/g, '\n').trim()
        : raw.replace(/\s+/g, ' ').trim()
      : '';
  if (!value) {
    if (required) errors[key] = 'required';
    return undefined;
  }
  if (value.length > MAX_LENGTH[key]) {
    errors[key] = 'tooLong';
    return undefined;
  }
  return value;
}

function readEnum<T extends string>(
  raw: unknown,
  allowed: readonly T[],
  key: keyof InquiryData,
  errors: Errors,
  required = false,
): T | undefined {
  if (raw === undefined || raw === null || raw === '') {
    if (required) errors[key] = 'required';
    return undefined;
  }
  if (typeof raw !== 'string' || !allowed.includes(raw as T)) {
    errors[key] = 'invalid';
    return undefined;
  }
  return raw as T;
}

function readDate(raw: unknown, key: keyof InquiryData, errors: Errors, required = false) {
  if (raw === undefined || raw === null || raw === '') {
    if (required) errors[key] = 'required';
    return undefined;
  }
  if (typeof raw !== 'string' || !DATE_PATTERN.test(raw)) {
    errors[key] = 'invalid';
    return undefined;
  }
  const parsed = new Date(`${raw}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== raw) {
    errors[key] = 'invalid';
    return undefined;
  }
  return raw;
}

function readNumber(
  raw: unknown,
  key: keyof InquiryData,
  errors: Errors,
  { min, max, integer }: { min: number; max: number; integer: boolean },
) {
  if (raw === undefined || raw === null || raw === '') return undefined;
  const value = typeof raw === 'number' ? raw : Number(String(raw).trim());
  if (!Number.isFinite(value) || (integer && !Number.isInteger(value))) {
    errors[key] = 'invalid';
    return undefined;
  }
  if (value < min || value > max) {
    errors[key] = 'outOfRange';
    return undefined;
  }
  return integer ? value : Math.round(value * 100) / 100;
}

function checkRange(
  start: string | undefined,
  end: string | undefined,
  endKey: keyof InquiryData,
  errors: Errors,
) {
  if (start && end && end < start) errors[endKey] = 'beforeStart';
}

export function validateInquiry(input: unknown): { data?: InquiryData; errors?: Errors } {
  const body = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
  const errors: Errors = {};

  const name = readText(body.name, 'name', errors, { required: true });
  const company = readText(body.company, 'company', errors);
  const email = readText(body.email, 'email', errors, { required: true });
  if (email && !EMAIL_PATTERN.test(email)) errors.email = 'invalid';

  const phone = readText(body.phone, 'phone', errors);
  if (phone && (!PHONE_PATTERN.test(phone) || phone.replace(/\D/g, '').length < 7)) {
    errors.phone = 'invalid';
  }

  const productionType = readEnum(body.productionType, PRODUCTION_TYPES, 'productionType', errors, true);
  const productionTypeOther = readText(body.productionTypeOther, 'productionTypeOther', errors, {
    required: productionType === 'other',
  });

  const shootDateStart = readDate(body.shootDateStart, 'shootDateStart', errors, true);
  const shootDateEnd = readDate(body.shootDateEnd, 'shootDateEnd', errors);
  const prepStrikeDateStart = readDate(body.prepStrikeDateStart, 'prepStrikeDateStart', errors);
  const prepStrikeDateEnd = readDate(body.prepStrikeDateEnd, 'prepStrikeDateEnd', errors);
  checkRange(shootDateStart, shootDateEnd, 'shootDateEnd', errors);
  checkRange(prepStrikeDateStart, prepStrikeDateEnd, 'prepStrikeDateEnd', errors);

  const crewSize = readNumber(body.crewSize, 'crewSize', errors, { min: 1, max: 5000, integer: true });
  const hoursNeeded = readNumber(body.hoursNeeded, 'hoursNeeded', errors, {
    min: 0.5,
    max: 2000,
    integer: false,
  });
  const vehicleCount = readNumber(body.vehicleCount, 'vehicleCount', errors, {
    min: 0,
    max: 500,
    integer: true,
  });

  const format = readEnum(body.format, FORMATS, 'format', errors);
  const projectBrand = readText(body.projectBrand, 'projectBrand', errors);
  const details = readText(body.details, 'details', errors, { multiline: true });

  if (Object.keys(errors).length > 0) return { errors };

  return {
    data: {
      name: name!,
      company,
      email: email!,
      phone,
      productionType: productionType!,
      productionTypeOther: productionType === 'other' ? productionTypeOther : undefined,
      shootDateStart: shootDateStart!,
      shootDateEnd,
      prepStrikeDateStart,
      prepStrikeDateEnd,
      crewSize,
      hoursNeeded,
      format,
      projectBrand,
      vehicleCount,
      details,
    },
  };
}

const PRODUCTION_TYPE_LABELS: Record<ProductionType, string> = {
  commercial: 'Commercial',
  editorial: 'Editorial',
  film_tv: 'Film & TV',
  corporate: 'Corporate',
  music_video: 'Music Video',
  other: 'Other',
};

const FORMAT_LABELS: Record<ProductionFormat, string> = {
  still: 'Still',
  motion: 'Motion',
  both: 'Both',
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function dateRange(start?: string, end?: string): string | undefined {
  if (!start) return undefined;
  return end && end !== start ? `${start} → ${end}` : start;
}

export function buildInquiryEmail(
  data: InquiryData,
  meta: { sourceUrl?: string; submittedAt: Date },
) {
  const productionType =
    data.productionType === 'other' && data.productionTypeOther
      ? `Other — ${data.productionTypeOther}`
      : PRODUCTION_TYPE_LABELS[data.productionType];

  const rows: Array<[string, string | number | undefined]> = [
    ['Name', data.name],
    ['Company / Production Company', data.company],
    ['Email', data.email],
    ['Phone', data.phone],
    ['Production Type', productionType],
    ['Shoot Date(s)', dateRange(data.shootDateStart, data.shootDateEnd)],
    ['Prep / Strike Date(s)', dateRange(data.prepStrikeDateStart, data.prepStrikeDateEnd)],
    ['Crew Size', data.crewSize],
    ['Hours Needed', data.hoursNeeded],
    ['Format', data.format ? FORMAT_LABELS[data.format] : undefined],
    ['Project / Brand', data.projectBrand],
    ['Estimated Number of Vehicles', data.vehicleCount],
    ['Additional Production Details / Special Requirements', data.details],
    ['Submitted From', meta.sourceUrl],
    ['Submitted At', meta.submittedAt.toISOString()],
  ];

  const filled = rows.filter(([, value]) => value !== undefined && value !== '') as Array<
    [string, string | number]
  >;

  const headline = data.projectBrand || data.company || data.name;
  const subject = `Production inquiry: ${headline}`.replace(/[\r\n]+/g, ' ').slice(0, 200);

  const text = filled.map(([label, value]) => `${label}:\n${value}`).join('\n\n');

  const html = `<!doctype html>
<html><body style="margin:0;padding:24px;background:#f5f5f4;font-family:Arial,Helvetica,sans-serif;color:#1c1917;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:8px;">
<tr><td style="padding:24px 24px 8px;font-size:20px;font-weight:bold;">New production inquiry</td></tr>
${filled
  .map(
    ([label, value]) => `<tr><td style="padding:12px 24px;border-top:1px solid #e7e5e4;">
<div style="font-size:12px;text-transform:uppercase;letter-spacing:0.04em;color:#78716c;">${escapeHtml(label)}</div>
<div style="font-size:15px;line-height:1.5;white-space:pre-wrap;">${escapeHtml(String(value))}</div>
</td></tr>`,
  )
  .join('\n')}
<tr><td style="padding:16px 24px 24px;font-size:12px;color:#78716c;border-top:1px solid #e7e5e4;">Reply to this email to respond directly to ${escapeHtml(data.name)}.</td></tr>
</table>
</body></html>`;

  return { subject, text, html };
}
