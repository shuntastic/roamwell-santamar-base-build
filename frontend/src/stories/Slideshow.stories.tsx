import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Slideshow } from '../components/slideshow/Slideshow';
import type { StrapiSlideshow } from '../types/cms';

const sample: StrapiSlideshow = {
  id: 1,
  title: 'Coastal light',
  autoplay: false,
  intervalMs: 5000,
  slides: [
    {
      id: 1,
      caption: 'Morning light over the shoreline',
      altText: 'Beach at sunrise',
      media: {
        id: 1,
        url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600',
        mime: 'image/jpeg',
      },
    },
    {
      id: 2,
      caption: 'Quiet terrace for late afternoons',
      altText: 'Terrace overlooking water',
      media: {
        id: 2,
        url: 'https://images.unsplash.com/photo-1499793983690-e8b21ebca3eb?w=1600',
        mime: 'image/jpeg',
      },
    },
  ],
};

const meta = {
  title: 'CMS/Slideshow',
  component: Slideshow,
  args: {
    slideshow: sample,
    transitionMs: 1000,
  },
} satisfies Meta<typeof Slideshow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const FastCrossfade: Story = {
  args: {
    transitionMs: 400,
  },
};

export const SingleSlide: Story = {
  args: {
    slideshow: {
      ...sample,
      slides: [sample.slides[0]],
    },
  },
};
