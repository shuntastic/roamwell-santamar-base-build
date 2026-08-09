import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ModalButtonBlock } from '../components/blocks/ModalButtonBlock';

const meta = {
  title: 'CMS/ModalButtonBlock',
  component: ModalButtonBlock,
  args: {
    block: {
      __component: 'blocks.modal-button' as const,
      id: 1,
      description: 'Review house guidelines before you arrive.',
      buttonLabel: 'View house rules',
      buttonVariant: 'primary' as const,
      modalTitle: 'House rules',
      modalContent: [
        {
          type: 'paragraph',
          children: [
            {
              type: 'text',
              text: 'Quiet hours begin at 10pm. Please leave shoes at the entry and treat shared spaces with care.',
            },
          ],
        },
        {
          type: 'paragraph',
          children: [
            { type: 'text', text: 'Check-out is at 11am. Keys may be left in the ceramic dish by the door.' },
          ],
        },
      ],
    },
  },
} satisfies Meta<typeof ModalButtonBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const ButtonOnly: Story = {
  args: {
    block: {
      __component: 'blocks.modal-button' as const,
      id: 2,
      buttonLabel: 'Read more',
      buttonVariant: 'text' as const,
      modalContent: [
        {
          type: 'paragraph',
          children: [{ type: 'text', text: 'Additional details appear here when the modal opens.' }],
        },
      ],
    },
  },
};
