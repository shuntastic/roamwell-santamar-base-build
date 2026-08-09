import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ImageTextBlock } from '../components/blocks/ImageTextBlock';

const coastalSuite = {
  id: 1,
  url: 'https://images.unsplash.com/photo-1615571022219-eb45cf7faa9d?auto=format&fit=crop&w=1200&q=80',
  alternativeText: 'Bright coastal suite with linen bedding',
};

const terraceView = {
  id: 2,
  url: 'https://images.unsplash.com/photo-1501117716987-c8e1ecb2101f?auto=format&fit=crop&w=1200&q=80',
  alternativeText: 'Open terrace overlooking the water',
};

const readingNook = {
  id: 3,
  url: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=1200&q=80',
  alternativeText: 'Quiet reading corner with soft light',
};

const copy = {
  title: 'Stay close to the shore',
  subheadline: 'Thoughtful rooms with sea air and quiet mornings.',
  body: [
    {
      type: 'paragraph' as const,
      children: [
        {
          type: 'text' as const,
          text: 'Each suite opens toward light and breeze, with materials chosen for calm — linen, stone, and warm wood.',
        },
      ],
    },
  ],
};

const meta = {
  title: 'CMS/ImageTextBlock',
  component: ImageTextBlock,
  args: {
    block: {
      __component: 'blocks.image-text' as const,
      id: 1,
      ...copy,
      images: [coastalSuite],
      autoplay: false,
    },
  },
} satisfies Meta<typeof ImageTextBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SingleImage: Story = {};

export const Slideshow: Story = {
  args: {
    block: {
      __component: 'blocks.image-text' as const,
      id: 2,
      ...copy,
      images: [coastalSuite, terraceView, readingNook],
      autoplay: true,
      intervalMs: 4000,
    },
  },
};

export const TitleOnly: Story = {
  args: {
    block: {
      __component: 'blocks.image-text' as const,
      id: 3,
      title: 'Quiet mornings by the water',
      images: [coastalSuite],
    },
  },
};
