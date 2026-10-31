/**
 * Public submission route only — inquiries are read in the admin Content Manager,
 * never through the public Content API.
 */
export default {
  routes: [
    {
      method: 'POST',
      path: '/production-inquiries/submit',
      handler: 'production-inquiry.submit',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
  ],
};
