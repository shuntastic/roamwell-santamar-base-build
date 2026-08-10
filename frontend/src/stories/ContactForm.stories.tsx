import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ContactFormBlock } from '../components/blocks/ContactFormBlock';

const contactImage = {
  id: 1,
  url: 'https://images.unsplash.com/photo-1499793983690-e8b21ccb4c95?auto=format&fit=crop&w=1200&q=80',
  alternativeText: 'Coastal porch with morning light',
};

const meta = {
  title: 'CMS/ContactForm',
  component: ContactFormBlock,
  args: {
    block: {
      __component: 'blocks.contact-form' as const,
      id: 1,
      title: 'Contact',
      intro: 'Reach our team in English, Spanish, or Portuguese.',
      image: contactImage,
      submitLabel: 'Send Message',
      successMessage: 'Thank you. We will be in touch soon.',
    },
  },
} satisfies Meta<typeof ContactFormBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithoutImage: Story = {
  args: {
    block: {
      __component: 'blocks.contact-form' as const,
      id: 2,
      title: 'Contact',
      intro: 'Reach our team in English, Spanish, or Portuguese.',
      submitLabel: 'Send Message',
      successMessage: 'Thank you. We will be in touch soon.',
    },
  },
};
