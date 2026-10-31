'use client';

import * as React from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import FormLabel from '@mui/material/FormLabel';
import Grid from '@mui/material/Grid';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import TextField, { type TextFieldProps } from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';
import SendIcon from '@mui/icons-material/Send';
import { useTheme } from '@mui/material/styles';
import type { BlocksProductionInquiryForm } from '@/types/cms';
import { STRAPI_URL } from '@/lib/strapi';
import { ThemeSection } from '@/components/layout/ThemeSection';
import {
  FORMATS,
  INQUIRY_FIELDS,
  PRODUCTION_TYPES,
  getInquiryCopy,
  type InquiryCopy,
  type InquiryErrorCode,
  type InquiryField,
} from '@/components/blocks/productionInquiryCopy';

type Props = {
  block: BlocksProductionInquiryForm;
  locale: string;
};

type Values = Record<InquiryField, string>;
type Errors = Partial<Record<InquiryField, InquiryErrorCode>>;

const EMPTY_VALUES = Object.fromEntries(INQUIRY_FIELDS.map((field) => [field, ''])) as Values;

/** Keep in sync with `cms/src/api/production-inquiry/services/inquiry-fields.ts`. */
const MAX_LENGTH: Partial<Record<InquiryField, number>> = {
  name: 120,
  company: 160,
  email: 254,
  phone: 40,
  productionTypeOther: 80,
  projectBrand: 160,
  details: 5000,
};

const NUMBER_RULES: Partial<Record<InquiryField, { min: number; max: number; integer: boolean }>> = {
  crewSize: { min: 1, max: 5000, integer: true },
  hoursNeeded: { min: 0.5, max: 2000, integer: false },
  vehicleCount: { min: 0, max: 500, integer: true },
};

const REQUIRED: InquiryField[] = ['name', 'email', 'productionType', 'shootDateStart'];

const DATE_RANGES: Array<[start: InquiryField, end: InquiryField]> = [
  ['shootDateStart', 'shootDateEnd'],
  ['prepStrikeDateStart', 'prepStrikeDateEnd'],
];

/**
 * Blackbox's `text.secondary` is white (for copy over hero media), which the form uses for
 * labels, hints, legends, and radios. Re-point the palette variables for this section only.
 */
const BLACKBOX_FORM_TEXT = {
  color: '#332b1b',
  '--mui-palette-text-primary': '#332b1b',
  '--mui-palette-text-primaryChannel': '51 43 27',
  '--mui-palette-text-secondary': '#332b1b',
  '--mui-palette-text-secondaryChannel': '51 43 27',
} as const;

const EMAIL_PATTERN = /^[^\s@<>()[\],;:"]+@[^\s@<>()[\],;:"]+\.[^\s@<>()[\],;:"]+$/;
const PHONE_PATTERN = /^[+()\d\s.\-/]*(?:\s*(?:x|ext\.?)\s*\d+)?$/i;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function validateField(field: InquiryField, values: Values): InquiryErrorCode | undefined {
  const value = values[field].trim();
  const required =
    REQUIRED.includes(field) ||
    (field === 'productionTypeOther' && values.productionType === 'other');

  if (!value) return required ? 'required' : undefined;

  const maxLength = MAX_LENGTH[field];
  if (maxLength && value.length > maxLength) return 'tooLong';

  if (field === 'email' && !EMAIL_PATTERN.test(value)) return 'invalid';
  if (field === 'phone' && (!PHONE_PATTERN.test(value) || value.replace(/\D/g, '').length < 7)) {
    return 'invalid';
  }

  const numberRule = NUMBER_RULES[field];
  if (numberRule) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || (numberRule.integer && !Number.isInteger(parsed))) {
      return 'invalid';
    }
    if (parsed < numberRule.min || parsed > numberRule.max) return 'outOfRange';
  }

  const range = DATE_RANGES.find(([start, end]) => field === start || field === end);
  if (range) {
    if (!DATE_PATTERN.test(value)) return 'invalid';
    const start = values[range[0]];
    if (field === range[1] && start && value < start) return 'beforeStart';
  }

  return undefined;
}

function validateAll(values: Values): Errors {
  const errors: Errors = {};
  for (const field of INQUIRY_FIELDS) {
    const code = validateField(field, values);
    if (code) errors[field] = code;
  }
  return errors;
}

function errorMessage(field: InquiryField, code: InquiryErrorCode, copy: InquiryCopy): string {
  switch (code) {
    case 'tooLong':
      return copy.errors.tooLong;
    case 'outOfRange':
      return copy.errors.outOfRange;
    case 'beforeStart':
      return copy.errors.beforeStart;
    case 'required':
      return field === 'productionType' ? copy.errors.choose : copy.errors.required;
    case 'invalid':
    default:
      if (field === 'email') return copy.errors.email;
      if (field === 'phone') return copy.errors.phone;
      if (field === 'productionType' || field === 'format') return copy.errors.choose;
      if (field === 'hoursNeeded') return copy.errors.number;
      if (NUMBER_RULES[field]) return copy.errors.wholeNumber;
      return copy.errors.date;
  }
}

function elapsedSince(startedAt: number) {
  return Date.now() - startedAt;
}

function withErrors(prev: Errors, patch: Partial<Record<InquiryField, InquiryErrorCode | undefined>>) {
  const next = { ...prev };
  for (const [field, code] of Object.entries(patch) as Array<[InquiryField, InquiryErrorCode | undefined]>) {
    if (code) next[field] = code;
    else delete next[field];
  }
  return next;
}

function FieldGroup({ legend, children }: { legend: string; children: React.ReactNode }) {
  return (
    <Box component="fieldset" sx={{ border: 0, m: 0, p: 0, minWidth: 0 }}>
      <Typography
        component="legend"
        variant="overline"
        sx={{ p: 0, mb: 2, color: 'text.secondary', letterSpacing: '0.12em', lineHeight: 1.6 }}
      >
        {legend}
      </Typography>
      <Grid container spacing={2}>
        {children}
      </Grid>
    </Box>
  );
}

export function ProductionInquiryFormBlock({ block, locale }: Props) {
  const theme = useTheme();
  const copy = getInquiryCopy(locale);
  const idPrefix = React.useId();
  const headingId = `${idPrefix}-heading`;
  const formRef = React.useRef<HTMLFormElement>(null);
  const successRef = React.useRef<HTMLDivElement>(null);
  const startedAtRef = React.useRef(0);

  const [values, setValues] = React.useState<Values>(EMPTY_VALUES);
  const [errors, setErrors] = React.useState<Errors>({});
  const [status, setStatus] = React.useState<'idle' | 'submitting' | 'success'>('idle');
  const [formError, setFormError] = React.useState<string | null>(null);

  React.useEffect(() => {
    startedAtRef.current = Date.now();
  }, []);

  React.useEffect(() => {
    if (status === 'success') successRef.current?.focus();
  }, [status]);

  const fieldId = (field: InquiryField) => `${idPrefix}-${field}`;

  const focusField = (field: InquiryField) => {
    const element = formRef.current?.querySelector<HTMLElement>(`[name="${field}"]`);
    if (!element) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    element.scrollIntoView({ block: 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
    element.focus({ preventScroll: true });
  };

  const handleChange =
    (field: InquiryField) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const next = { ...values, [field]: event.target.value };
      setValues(next);

      // Clear errors as soon as they are fixed; don't introduce new ones while typing.
      const patch: Partial<Record<InquiryField, InquiryErrorCode | undefined>> = {};
      if (errors[field]) patch[field] = validateField(field, next);
      for (const [start, end] of DATE_RANGES) {
        if (field === start && (errors[end] || next[end])) patch[end] = validateField(end, next);
      }
      if (field === 'productionType' && next.productionType !== 'other') {
        patch.productionTypeOther = undefined;
      }
      if (Object.keys(patch).length) setErrors((prev) => withErrors(prev, patch));
    };

  // Format errors show on blur; "required" waits for submit so tabbing through doesn't nag.
  const handleBlur = (field: InquiryField) => () => {
    if (!values[field].trim()) return;
    setErrors((prev) => withErrors(prev, { [field]: validateField(field, values) }));
  };

  const textField = (
    field: InquiryField,
    {
      hint,
      htmlInput,
      ...rest
    }: Partial<TextFieldProps> & { hint?: string; htmlInput?: Record<string, unknown> } = {},
  ): TextFieldProps => {
    const code = errors[field];
    return {
      id: fieldId(field),
      name: field,
      label: copy.labels[field],
      value: values[field],
      onChange: handleChange(field),
      onBlur: handleBlur(field),
      required: REQUIRED.includes(field),
      error: Boolean(code),
      helperText: code ? errorMessage(field, code, copy) : hint,
      fullWidth: true,
      ...rest,
      slotProps: {
        htmlInput: { maxLength: MAX_LENGTH[field], ...htmlInput },
        ...(rest.type === 'date' ? { inputLabel: { shrink: true } } : null),
      },
    };
  };

  const radioField = (
    field: 'productionType' | 'format',
    options: readonly string[],
    labels: Record<string, string>,
  ) => {
    const code = errors[field];
    const required = REQUIRED.includes(field);
    const errorId = `${fieldId(field)}-error`;
    return (
      <FormControl component="fieldset" error={Boolean(code)} required={required} fullWidth>
        <FormLabel component="legend" id={`${fieldId(field)}-label`} sx={{ mb: 0.5 }}>
          {copy.labels[field]}
        </FormLabel>
        <RadioGroup
          row
          name={field}
          value={values[field]}
          onChange={handleChange(field)}
          aria-labelledby={`${fieldId(field)}-label`}
          aria-required={required || undefined}
          aria-describedby={code ? errorId : undefined}
          sx={{ columnGap: 1 }}
        >
          {options.map((option) => (
            <FormControlLabel key={option} value={option} control={<Radio />} label={labels[option]} />
          ))}
        </RadioGroup>
        {code ? <FormHelperText id={errorId}>{errorMessage(field, code, copy)}</FormHelperText> : null}
      </FormControl>
    );
  };

  const dateRange = (legend: string, start: InquiryField, end: InquiryField) => (
    <Box component="fieldset" sx={{ border: 0, m: 0, p: 0, minWidth: 0 }}>
      <FormLabel component="legend" sx={{ mb: 1.5 }}>
        {legend}
      </FormLabel>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField {...textField(start, { type: 'date' })} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            {...textField(end, {
              type: 'date',
              hint: copy.hints.endDate,
              htmlInput: { min: values[start] || undefined },
            })}
          />
        </Grid>
      </Grid>
    </Box>
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === 'submitting') return;

    const nextErrors = validateAll(values);
    setErrors(nextErrors);
    const invalid = INQUIRY_FIELDS.filter((field) => nextErrors[field]);
    if (invalid.length) {
      setFormError(copy.summary(invalid.length));
      focusField(invalid[0]);
      return;
    }

    setFormError(null);
    setStatus('submitting');

    const data = Object.fromEntries(
      INQUIRY_FIELDS.filter(
        (field) =>
          values[field].trim() &&
          (field !== 'productionTypeOther' || values.productionType === 'other'),
      ).map((field) => [field, values[field].trim()]),
    );
    const honeypot = formRef.current?.elements.namedItem('website') as HTMLInputElement | null;

    try {
      const response = await fetch(`${STRAPI_URL}/api/production-inquiries/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          formId: block.id,
          locale,
          sourceUrl: window.location.href,
          elapsedMs: elapsedSince(startedAtRef.current),
          website: honeypot?.value ?? '',
          data,
        }),
      });

      if (response.ok) {
        setStatus('success');
        return;
      }

      const body = (await response.json().catch(() => null)) as {
        error?: { details?: { errors?: Record<string, InquiryErrorCode> } };
      } | null;
      const serverErrors = body?.error?.details?.errors ?? {};
      const fieldErrors = Object.fromEntries(
        INQUIRY_FIELDS.filter((field) => serverErrors[field]).map((field) => [field, serverErrors[field]]),
      ) as Errors;
      const firstInvalid = INQUIRY_FIELDS.find((field) => fieldErrors[field]);

      if (response.status === 400 && firstInvalid) {
        setErrors(fieldErrors);
        setFormError(copy.summary(Object.keys(fieldErrors).length));
        focusField(firstInvalid);
      } else if (response.status === 429) {
        setFormError(copy.rateLimited);
      } else if (response.status === 404 || response.status >= 500) {
        setFormError(copy.unavailable);
      } else {
        setFormError(copy.failed);
      }
    } catch {
      setFormError(copy.failed);
    }
    setStatus('idle');
  };

  const reset = () => {
    setValues(EMPTY_VALUES);
    setErrors({});
    setFormError(null);
    setStatus('idle');
    startedAtRef.current = Date.now();
  };

  const submitting = status === 'submitting';

  return (
    <ThemeSection maxWidth="lg" sx={theme.layout.id === 'blackbox' ? BLACKBOX_FORM_TEXT : undefined}>
      <Typography id={headingId} variant="h2" sx={{ mb: block.intro ? 1.5 : 3 }}>
        {block.title || copy.title}
      </Typography>
      {block.intro ? (
        <Typography color="text.secondary" sx={{ mb: 4, maxWidth: 640, whiteSpace: 'pre-line' }}>
          {block.intro}
        </Typography>
      ) : null}

      {status === 'success' ? (
        <Box
          ref={successRef}
          tabIndex={-1}
          role="status"
          sx={{
            outline: 'none',
            textAlign: 'center',
            py: { xs: 5, md: 7 },
            px: 3,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: `${theme.layout.cardRadius}px`,
          }}
        >
          <CheckCircleOutlineIcon color="primary" aria-hidden sx={{ fontSize: 48, mb: 2 }} />
          <Typography variant="h4" component="h3" sx={{ mb: 1 }}>
            {copy.successHeading}
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3, maxWidth: 480, mx: 'auto' }}>
            {block.successMessage || copy.success}
          </Typography>
          <Button variant="text" onClick={reset}>
            {copy.sendAnother}
          </Button>
        </Box>
      ) : (
        <Box
          component="form"
          ref={formRef}
          noValidate
          aria-labelledby={headingId}
          aria-busy={submitting}
          onSubmit={handleSubmit}
          sx={{ position: 'relative', display: 'grid', gap: { xs: 4, md: 5 } }}
        >
          <Typography variant="body2" color="text.secondary" sx={{ mb: -2 }}>
            {copy.requiredNote}
          </Typography>

          {formError ? (
            <Alert severity="error" role="alert">
              {formError}
            </Alert>
          ) : null}

          <FieldGroup legend={copy.groups.contact}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField {...textField('name', { autoComplete: 'name' })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField {...textField('company', { autoComplete: 'organization' })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                {...textField('email', {
                  type: 'email',
                  autoComplete: 'email',
                  htmlInput: { inputMode: 'email', spellCheck: false },
                })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                {...textField('phone', {
                  type: 'tel',
                  autoComplete: 'tel',
                  htmlInput: { inputMode: 'tel' },
                })}
              />
            </Grid>
          </FieldGroup>

          <FieldGroup legend={copy.groups.production}>
            <Grid size={12}>
              <TextField {...textField('projectBrand')} />
            </Grid>
            <Grid size={12}>
              {radioField('productionType', PRODUCTION_TYPES, copy.productionTypes)}
            </Grid>
            {values.productionType === 'other' ? (
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField {...textField('productionTypeOther')} required />
              </Grid>
            ) : null}
            <Grid size={12}>{radioField('format', FORMATS, copy.formats)}</Grid>
          </FieldGroup>

          <FieldGroup legend={copy.groups.schedule}>
            <Grid size={{ xs: 12, md: 6 }}>
              {dateRange(copy.labels.shootDates, 'shootDateStart', 'shootDateEnd')}
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              {dateRange(copy.labels.prepStrikeDates, 'prepStrikeDateStart', 'prepStrikeDateEnd')}
            </Grid>
          </FieldGroup>

          <FieldGroup legend={copy.groups.logistics}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                {...textField('crewSize', { htmlInput: { inputMode: 'numeric', pattern: '[0-9]*' } })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField {...textField('hoursNeeded', { htmlInput: { inputMode: 'decimal' } })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                {...textField('vehicleCount', {
                  htmlInput: { inputMode: 'numeric', pattern: '[0-9]*' },
                })}
              />
            </Grid>
            <Grid size={12}>
              <TextField
                {...textField('details', { multiline: true, minRows: 5, hint: copy.hints.details })}
              />
            </Grid>
          </FieldGroup>

          <Box
            aria-hidden
            sx={{ position: 'absolute', left: '-10000px', width: '1px', height: '1px', overflow: 'hidden' }}
          >
            <label htmlFor={`${idPrefix}-website`}>Website</label>
            <input id={`${idPrefix}-website`} name="website" type="text" tabIndex={-1} autoComplete="off" />
          </Box>

          <Box>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              loading={submitting}
              loadingPosition="end"
              endIcon={<SendIcon aria-hidden />}
              sx={{ width: { xs: '100%', sm: 'auto' }, minWidth: { sm: 220 } }}
            >
              {submitting ? copy.submitting : block.submitLabel || copy.submit}
            </Button>
          </Box>
        </Box>
      )}
    </ThemeSection>
  );
}
