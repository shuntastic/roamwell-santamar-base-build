/**
 * Ensure at most one primary site (isPrimary=true).
 */
export default {
  async beforeCreate(event: { params: { data?: Record<string, unknown> } }) {
    const data = event.params.data;
    if (!data?.isPrimary) return;

    const existing = await strapi.db.query('api::site.site').findMany({
      where: { isPrimary: true },
    });
    for (const site of existing) {
      await strapi.db.query('api::site.site').update({
        where: { id: site.id },
        data: { isPrimary: false },
      });
    }
  },

  async beforeUpdate(event: {
    params: { data?: Record<string, unknown>; where?: { id?: number } };
  }) {
    const data = event.params.data;
    if (!data?.isPrimary) return;

    const currentId = event.params.where?.id;
    const existing = await strapi.db.query('api::site.site').findMany({
      where: { isPrimary: true },
    });
    for (const site of existing) {
      if (currentId && site.id === currentId) continue;
      await strapi.db.query('api::site.site').update({
        where: { id: site.id },
        data: { isPrimary: false },
      });
    }
  },
};
