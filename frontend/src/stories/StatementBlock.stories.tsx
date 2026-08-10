import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { StatementBlock } from '../components/blocks/StatementBlock';

const meta = {
  title: 'CMS/StatementBlock',
  component: StatementBlock,
  args: {
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
