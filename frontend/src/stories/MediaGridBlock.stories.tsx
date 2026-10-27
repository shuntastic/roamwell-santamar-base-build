import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { MediaGridBlock } from '../components/blocks/MediaGridBlock';
import type { BlocksMediaGrid, BlocksMediaGridItem, StrapiMedia } from '../types/cms';

function image(id: number, url: string, alternativeText: string): StrapiMedia {
  return { id, url, alternativeText, mime: 'image/jpeg' };
}

const suite = image(
  1,
  'https://images.unsplash.com/photo-1615571022219-eb45cf7faa9d?auto=format&fit=crop&w=1600&q=80',
  'Bright coastal suite with linen bedding',
);
const terrace = image(
  2,
  'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1600&q=80',
  'Modern terrace with a view of the water',
);
const nook = image(
  3,
  'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=1600&q=80',
  'Quiet reading corner with soft light',
);
const shore = image(
  4,
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80',
  'Turquoise water meeting a pale shore',
);
const table = image(
  5,
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1600&q=80',
  'A long table set for dinner',
);
const court = image(
  6,
  'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1600&q=80',
  'Still courtyard pool in late light',
);
const wavePoster = image(
  7,
  'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1600&q=80',
  'Waves breaking toward the beach',
);

function category(id: number, categoryname: string) {
  return {
    id,
    media_categories: [{ id, documentId: `cat-${id}`, categoryname }],
  };
}

const categories = [category(1, 'Suites'), category(2, 'Coast'), category(3, 'Table')];

const items: BlocksMediaGridItem[] = [
  {
    id: 1,
    media: suite,
    title: 'Morning suite',
    caption: 'Linen, stone, and a window that stays open to the breeze.',
    categories: [category(1, 'Suites')],
  },
  {
    id: 2,
    media: terrace,
    title: 'West terrace',
    caption: 'The long view after the heat drops.',
    categories: [category(1, 'Suites'), category(2, 'Coast')],
  },
  {
    id: 3,
    media: nook,
    title: 'Reading nook',
    caption: 'A quiet corner for the middle of the day.',
    categories: [category(1, 'Suites')],
  },
  {
    id: 4,
    media: shore,
    title: 'The shore path',
    caption: 'Ten minutes on foot, shoes optional.',
    categories: [category(2, 'Coast')],
  },
  {
    id: 5,
    media: {
      id: 8,
      url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
      mime: 'video/mp4',
      alternativeText: 'Close view of a flower moving in the wind',
    },
    poster: wavePoster,
    title: 'On the water',
    caption: 'Short clip from the rocks below the house.',
    categories: [category(2, 'Coast')],
  },
  {
    id: 6,
    media: table,
    title: 'Supper',
    caption: 'One table, late, with the doors left open.',
    categories: [category(3, 'Table')],
  },
  {
    id: 7,
    media: court,
    title: 'Courtyard',
    categories: [],
  },
];

function gallery(overrides: Partial<BlocksMediaGrid> = {}): BlocksMediaGrid {
  return {
    __component: 'blocks.media-grid',
    id: 1,
    title: 'The house in pictures',
    maxColumns: 3,
    showItemTitles: true,
    categories,
    items,
    ...overrides,
  };
}

const meta = {
  title: 'CMS/MediaGridBlock',
  component: MediaGridBlock,
  args: {
    block: gallery(),
  },
} satisfies Meta<typeof MediaGridBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Gallery: Story = {};

export const TitlesHidden: Story = {
  args: {
    block: gallery({ id: 2, showItemTitles: false }),
  },
};

export const TwoColumns: Story = {
  args: {
    block: gallery({ id: 3, title: 'Two across', maxColumns: 2 }),
  },
};
