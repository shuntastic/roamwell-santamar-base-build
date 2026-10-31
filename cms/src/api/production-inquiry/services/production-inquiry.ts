/**
 * production-inquiry service
 */

import { factories } from '@strapi/strapi';
import { buildInquiryEmail, type InquiryData } from './inquiry-fields';

const UID = 'api::production-inquiry.production-inquiry';

export default factories.createCoreService(UID, ({ strapi }) => ({
  /** Recipients configured on a Production Inquiry Form block (never sent to the browser). */
  async getFormRecipients(formId: number): Promise<string[] | null> {
    const form = await strapi.db.query('blocks.production-inquiry-form').findOne({
      where: { id: formId },
      populate: { recipients: true },
    });
    if (!form) return null;

    const recipients = ((form.recipients ?? []) as Array<{ email?: string | null }>)
      .map((recipient) => recipient.email?.trim().toLowerCase())
      .filter((email): email is string => Boolean(email));
    return Array.from(new Set(recipients));
  },

  /**
   * Persist the inquiry first so it is never lost, then email it in the background.
   * Delivery outcome is recorded on the entry's `emailStatus`.
   */
  async submit(
    data: InquiryData,
    recipients: string[],
    meta: { sourceUrl?: string; locale?: string },
  ) {
    const entry = await strapi.documents(UID).create({
      data: {
        ...data,
        sourceUrl: meta.sourceUrl,
        submittedLocale: meta.locale,
        recipients: recipients.join(', '),
        emailStatus: 'pending',
      },
    });

    const email = buildInquiryEmail(data, {
      sourceUrl: meta.sourceUrl,
      submittedAt: new Date(),
    });

    void strapi
      .plugin('email')
      .service('email')
      .send({
        to: recipients.join(', '),
        replyTo: data.email,
        subject: email.subject,
        text: email.text,
        html: email.html,
      })
      .then(() => 'sent' as const)
      .catch((error: unknown) => {
        strapi.log.error(`[production-inquiry] Email delivery failed for ${entry.documentId}`);
        strapi.log.error(error);
        return 'failed' as const;
      })
      .then((emailStatus: 'sent' | 'failed') =>
        strapi.documents(UID).update({ documentId: entry.documentId, data: { emailStatus } }),
      )
      .catch((error: unknown) => strapi.log.error(error));

    return entry;
  },
}));
