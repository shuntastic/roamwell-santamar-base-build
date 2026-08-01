import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ContactFormBlock } from '../components/blocks/ContactFormBlock';

const meta = {
  title: 'CMS/ContactForm',
  component: ContactFormBlock,
  args: {
    block: {
      __component: 'blocks.contact-form' as const,
      id: 1,
      title: 'Contact',
      intro: 'Reach our team in English, Spanish, or Portuguese.',
      submitLabel: 'Send Message',
      successMessage: 'Thank you. We will be in touch soon.',
    },
  },
} satisfies Meta<typeof ContactFormBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
