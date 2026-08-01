import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { StyledCopy } from '../components/ui/StyledCopy';

const meta = {
  title: 'CMS/StyledCopy',
  component: StyledCopy,
  args: {
    content: [
      {
        type: 'heading',
        level: 2,
        children: [{ type: 'text', text: 'Stay close to the water' }],
      },
      {
        type: 'paragraph',
        children: [
          { type: 'text', text: 'Styled copy blocks are authored in Strapi and rendered with ' },
          { type: 'text', text: 'editorial emphasis', bold: true },
          { type: 'text', text: ' on the front-end.' },
        ],
      },
    ],
  },
} satisfies Meta<typeof StyledCopy>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
