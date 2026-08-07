import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ImageTextBlock } from '../components/blocks/ImageTextBlock';

const meta = {
  title: 'CMS/ImageTextBlock',
  component: ImageTextBlock,
  args: {
    block: {
      __component: 'blocks.image-text' as const,
      id: 1,
      title: 'Stay close to the shore',
      subheadline: 'Thoughtful rooms with sea air and quiet mornings.',
      body: [
        {
          type: 'paragraph',
          children: [
            {
              type: 'text',
              text: 'Each suite opens toward light and breeze, with materials chosen for calm — linen, stone, and warm wood.',
            },
          ],
        },
      ],
      image: {
        id: 1,
        url: 'https://images.unsplash.com/photo-1615571022219-eb45cf7faa9d?auto=format&fit=crop&w=1200&q=80',
        alternativeText: 'Bright coastal suite with linen bedding',
      },
    },
  },
} satisfies Meta<typeof ImageTextBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const TitleOnly: Story = {
  args: {
    block: {
      __component: 'blocks.image-text' as const,
      id: 2,
      title: 'Quiet mornings by the water',
      image: {
        id: 2,
        url: 'https://images.unsplash.com/photo-1615571022219-eb45cf7faa9d?auto=format&fit=crop&w=1200&q=80',
        alternativeText: 'Coastal suite',
      },
    },
  },
};
