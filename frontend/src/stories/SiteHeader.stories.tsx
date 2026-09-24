import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { SiteHeader } from '../components/layout/SiteHeader';

const meta = {
  title: 'Layout/SiteHeader',
  component: SiteHeader,
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      navigation: {
        pathname: '/en',
      },
    },
  },
} satisfies Meta<typeof SiteHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MultiPage: Story = {
  args: {
    locale: 'en',
    siteName: 'Santamar',
    template: 'multi_page',
    items: [
      { label: 'Home', url: '/', order: 0, targetType: 'page' },
      { label: 'Accommodations', url: '/accommodations', order: 1, targetType: 'page' },
      { label: 'Contact', url: '/contact', order: 2, targetType: 'page' },
    ],
  },
};

export const SinglePageHashNav: Story = {
  args: {
    locale: 'en',
    siteName: 'Coast House',
    template: 'single_page',
    items: [
      { label: 'Stay', order: 0, targetType: 'section', sectionAnchor: 'stay' },
      { label: 'Location', order: 1, targetType: 'section', sectionAnchor: 'location' },
      { label: 'Book', order: 2, targetType: 'section', sectionAnchor: 'book' },
    ],
  },
  render: (args) => (
    <Box>
      <SiteHeader {...args} />
      <Box id="stay" component="section" sx={{ minHeight: '70vh', p: 4, bgcolor: 'action.hover' }}>
        <Typography variant="h2">Stay</Typography>
        <Typography color="text.secondary">Scroll target for the Stay nav item.</Typography>
      </Box>
      <Box id="location" component="section" sx={{ minHeight: '70vh', p: 4 }}>
        <Typography variant="h2">Location</Typography>
        <Typography color="text.secondary">Scroll target for Location.</Typography>
      </Box>
      <Box id="book" component="section" sx={{ minHeight: '70vh', p: 4, bgcolor: 'action.hover' }}>
        <Typography variant="h2">Book</Typography>
        <Typography color="text.secondary">Scroll target for Book.</Typography>
      </Box>
    </Box>
  ),
};
