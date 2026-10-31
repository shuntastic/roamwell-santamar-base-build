import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { CtaButtonsBlock } from '../components/blocks/CtaButtonsBlock';

const meta = {
  title: 'CMS/CtaButtonsBlock',
  component: CtaButtonsBlock,
  args: {
    locale: 'en',
    block: {
      __component: 'blocks.cta-buttons' as const,
      id: 1,
      buttons: [
        { id: 1, label: 'Book Your Stay', url: '/book-your-stay', size: 'large' as const, style: 'primary' as const },
        { id: 2, label: 'View Accommodations', url: '/accommodations', size: 'large' as const, style: 'secondary' as const },
        {
          id: 3,
          label: 'Instagram',
          url: 'https://www.instagram.com/',
          openInNewTab: true,
          size: 'large' as const,
          style: 'text' as const,
        },
      ],
    },
  },
} satisfies Meta<typeof CtaButtonsBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ThreeButtons: Story = {};

export const SingleButton: Story = {
  args: {
    block: {
      __component: 'blocks.cta-buttons' as const,
      id: 2,
      buttons: [{ id: 1, label: 'Contact Us', url: '/contact', size: 'medium' as const, style: 'primary' as const }],
    },
  },
};

export const MixedSizes: Story = {
  args: {
    block: {
      __component: 'blocks.cta-buttons' as const,
      id: 3,
      buttons: [
        { id: 1, label: 'Small', url: '/contact', size: 'small' as const, style: 'secondary' as const },
        { id: 2, label: 'Medium', url: '/contact', size: 'medium' as const, style: 'primary' as const },
        { id: 3, label: 'Large', url: '/contact', size: 'large' as const, style: 'secondary' as const },
      ],
    },
  },
};
