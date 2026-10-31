import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { StatementBlock } from '../components/blocks/StatementBlock';

const meta = {
  title: 'CMS/StatementBlock',
  component: StatementBlock,
  args: {
    locale: 'en',
    block: {
      __component: 'blocks.statement' as const,
      id: 1,
      title: 'Quiet mornings, salt air, and rooms that feel like a pause.',
      body: 'A note from the house — hospitality shaped by place.',
    },
  },
} satisfies Meta<typeof StatementBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const TitleOnly: Story = {
  args: {
    block: {
      __component: 'blocks.statement' as const,
      id: 2,
      title: 'Come for the coast. Stay for the calm.',
    },
  },
};

export const WithButtons: Story = {
  args: {
    block: {
      __component: 'blocks.statement' as const,
      id: 3,
      title: 'Quiet mornings, salt air, and rooms that feel like a pause.',
      body: 'A note from the house — hospitality shaped by place.',
      buttons: [
        { id: 1, label: 'Book Your Stay', url: '/book-your-stay', size: 'large' as const, style: 'primary' as const },
        { id: 2, label: 'View Accommodations', url: '/accommodations', size: 'large' as const, style: 'secondary' as const },
      ],
    },
  },
};

export const WithSingleTextLink: Story = {
  args: {
    block: {
      __component: 'blocks.statement' as const,
      id: 4,
      title: 'Come for the coast. Stay for the calm.',
      buttons: [
        {
          id: 1,
          label: 'Follow us on Instagram',
          url: 'https://www.instagram.com/',
          openInNewTab: true,
          size: 'medium' as const,
          style: 'text' as const,
        },
      ],
    },
  },
};
