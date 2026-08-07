import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { HeroBlock } from '../components/blocks/HeroBlock';

const meta = {
  title: 'CMS/HeroBlock',
  component: HeroBlock,
  args: {
    locale: 'en',
    block: {
      __component: 'blocks.hero' as const,
      id: 1,
      eyebrow: 'Santamar',
      headline: 'Coastal calm, curated stays',
      subheadline: 'A hospitality framework powered by Strapi and Next.js.',
      description: [
        {
          type: 'paragraph',
          children: [
            {
              type: 'text',
              text: 'Discover thoughtfully designed accommodations, local experiences, and effortless booking — all from one place.',
            },
          ],
        },
      ],
      cta: {
        label: 'Book Your Stay',
        url: '/book-your-stay',
        variant: 'primary' as const,
      },
    },
  },
} satisfies Meta<typeof HeroBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
