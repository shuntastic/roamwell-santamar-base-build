/**
 * Custom site routes (public resolve by hostname).
 * Provision lives on the admin router — see 02-admin-site.ts.
 */
export default {
  routes: [
    {
      method: 'GET',
      path: '/sites/resolve',
      handler: 'site.resolve',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
  ],
};
