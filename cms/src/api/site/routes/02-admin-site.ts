/**
 * Admin routes for site provisioning (requires authenticated Strapi admin).
 */
export default {
  type: 'admin' as const,
  routes: [
    {
      method: 'POST',
      path: '/sites/provision',
      handler: 'site.provision',
      config: {
        policies: ['admin::isAuthenticatedAdmin'],
      },
    },
  ],
};
