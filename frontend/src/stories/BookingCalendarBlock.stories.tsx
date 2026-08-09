import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { BookingCalendarBlock } from '../components/blocks/BookingCalendarBlock';

const meta = {
  title: 'CMS/BookingCalendarBlock',
  component: BookingCalendarBlock,
  args: {
    block: {
      __component: 'blocks.booking-calendar' as const,
      id: 1,
      title: 'Check availability',
      cloudfrontSubdomain: 'd2q3n06xhbi0am',
      baseUrl: 'https://www.example.com/',
      listingId: 40467,
      numberOfMonths: '2' as const,
      openInNewTab: true,
      buttonAction: 'checkout' as const,
      buttonText: 'Book now',
      clearButtonText: 'Clear dates',
      rounded: true,
    },
  },
} satisfies Meta<typeof BookingCalendarBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
