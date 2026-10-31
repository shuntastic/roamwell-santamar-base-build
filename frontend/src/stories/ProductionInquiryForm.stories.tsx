import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ProductionInquiryFormBlock } from '../components/blocks/ProductionInquiryFormBlock';

const meta = {
  title: 'CMS/ProductionInquiryForm',
  component: ProductionInquiryFormBlock,
  args: {
    locale: 'en',
    block: {
      __component: 'blocks.production-inquiry-form' as const,
      id: 1,
      title: 'Check Availability',
      intro:
        'Have a project in mind? Send us a few production details and we’ll get back to you with availability and a quote. Rates are based on production type, crew size, hours, usage, and location requirements.\n\nScouting visits are available by appointment.',
      submitLabel: 'Check Availability',
      successMessage: 'Thank you. Our production team will be in touch shortly.',
    },
  },
} satisfies Meta<typeof ProductionInquiryFormBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Spanish: Story = {
  args: {
    locale: 'es',
    block: {
      __component: 'blocks.production-inquiry-form' as const,
      id: 2,
    },
  },
};
