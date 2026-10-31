import type { Core } from '@strapi/strapi';

const allowedMediaTypes = [
  'image/*',
  'video/*',
  'audio/*',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.*',
  'text/plain',
  'text/csv',
];

const deniedExecutableTypes = [
  'application/vnd.microsoft.portable-executable',
  'application/x-msdownload',
  'application/x-msdos-program',
  'application/x-executable',
  'application/x-dosexec',
  'application/x-sh',
  'text/x-shellscript',
  'application/x-mach-binary',
];

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Plugin => ({
  'users-permissions': {
    config: {
      jwtManagement: 'refresh',
      sessions: {
        httpOnly: true,
      },
    },
  },
  upload: {
    config: {
      security: {
        allowedTypes: allowedMediaTypes,
        deniedTypes: deniedExecutableTypes,
      },
    },
  },
  // Form notifications. Set SMTP_HOST to relay through a real mail server; without it,
  // sendmail delivers directly to recipients' MX hosts and is often filtered as spam.
  email: {
    config: env('SMTP_HOST')
      ? {
          provider: 'nodemailer',
          providerOptions: {
            host: env('SMTP_HOST'),
            port: env.int('SMTP_PORT', 587),
            secure: env.bool('SMTP_SECURE', false),
            auth: env('SMTP_USERNAME')
              ? { user: env('SMTP_USERNAME'), pass: env('SMTP_PASSWORD') }
              : undefined,
          },
          settings: {
            defaultFrom: env('EMAIL_FROM', 'no-reply@santamar.example'),
            defaultReplyTo: env('EMAIL_FROM', 'no-reply@santamar.example'),
          },
        }
      : {
          provider: 'sendmail',
          settings: {
            defaultFrom: env('EMAIL_FROM', 'no-reply@santamar.example'),
            defaultReplyTo: env('EMAIL_FROM', 'no-reply@santamar.example'),
          },
        },
  },
});

export default config;
