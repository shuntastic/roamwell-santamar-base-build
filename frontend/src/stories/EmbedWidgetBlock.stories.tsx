import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { EmbedWidgetBlock } from '../components/blocks/EmbedWidgetBlock';

const CALENDAR_EMBED = `<div id="hostaway-calendar-widget"></div>
<script src="https://d2q3n06xhbi0am.cloudfront.net/calendar.js"></script>
<script>
    window.hostawayCalendarWidget({
    baseUrl: 'http://penthousedepuntasur.staycoastandcanopy.com/',
    listingId: 591793,
    numberOfMonths: 2,
    openInNewTab: true,
    font: 'Open Sans',
    rounded: true,
    button: {
      action: 'checkout',
      text: 'Book now',
    },
    clearButtonText: 'Clear dates',
    color: {
      mainColor: '#ff0000',
      frameColor: '#000000',
      textColor: 'green',
    },
  })
</script>`;

const SEARCH_EMBED = `<script src="https://d2q3n06xhbi0am.cloudfront.net/widget.js?1640277196"></script>
<script>
  window.searchBar({
    baseUrl: 'http://penthousedepuntasur.staycoastandcanopy.com/',
    showLocation: true,
    color: '#cc2dcf',
    rounded: true,
    openInNewTab: true,
    font: 'Open Sans',
  });
</script>
<div id="hostaway-booking-widget"></div>`;

const meta = {
  title: 'CMS/EmbedWidgetBlock',
  component: EmbedWidgetBlock,
  args: {
    title: 'Availability',
    variant: 'calendar' as const,
    embedCode: CALENDAR_EMBED,
  },
} satisfies Meta<typeof EmbedWidgetBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Calendar: Story = {};

export const Search: Story = {
  args: {
    title: 'Search stays',
    variant: 'search',
    embedCode: SEARCH_EMBED,
  },
};

export const BlockedScriptHost: Story = {
  args: {
    title: 'Blocked',
    embedCode: `<div id="x"></div><script src="https://evil.example/hack.js"></script>`,
  },
};
