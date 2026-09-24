/**
 * Enforce unique slug per site (+ locale via document service context when available).
 */
export default {
  async beforeCreate(event: {
    params: { data?: Record<string, unknown>; locale?: string };
  }) {
    await assertUniqueSlug(event.params.data, event.params.locale, undefined);
  },

  async beforeUpdate(event: {
    params: { data?: Record<string, unknown>; where?: { id?: number }; locale?: string };
  }) {
    await assertUniqueSlug(event.params.data, event.params.locale, event.params.where?.id);
  },
};

async function assertUniqueSlug(
  data: Record<string, unknown> | undefined,
  locale: string | undefined,
  excludeId: number | undefined,
) {
  if (!data?.slug) return;

  const siteId =
    typeof data.site === 'object' && data.site && 'id' in (data.site as object)
      ? (data.site as { id: number }).id
      : typeof data.site === 'number'
        ? data.site
        : typeof data.site === 'string'
          ? Number(data.site)
          : undefined;

  if (!siteId || Number.isNaN(siteId)) return;

  const where: Record<string, unknown> = {
    slug: data.slug,
    site: siteId,
  };
  if (locale) {
    where.locale = locale;
  }

  const matches = await strapi.db.query('api::page.page').findMany({ where });
  const conflict = matches.find((row) => !excludeId || row.id !== excludeId);
  if (conflict) {
    throw new Error(
      `Page slug "${data.slug}" already exists for this site${locale ? ` (${locale})` : ''}.`,
    );
  }
}
