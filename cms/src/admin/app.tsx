import type { StrapiApp } from '@strapi/strapi/admin';
import { PuzzlePiece } from '@strapi/icons';

export default {
  config: {
    locales: [],
  },
  bootstrap(app: StrapiApp) {
    app.addMenuLink({
      to: '/provision-site',
      icon: PuzzlePiece,
      intlLabel: {
        id: 'santamar.provision-site',
        defaultMessage: 'Provision site',
      },
      Component: async () => {
        const mod = await import('./pages/ProvisionSitePage');
        return mod.default;
      },
      permissions: [],
    });
  },
};
