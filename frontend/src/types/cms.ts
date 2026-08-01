export type StrapiMedia = {
  id: number;
  documentId?: string;
  url: string;
  alternativeText?: string | null;
  mime?: string;
  width?: number;
  height?: number;
};

export type StrapiLink = {
  id?: number;
  label: string;
  url: string;
  openInNewTab?: boolean;
  variant?: 'primary' | 'secondary' | 'text';
};

export type StrapiSlide = {
  id?: number;
  media: StrapiMedia;
  caption?: string | null;
  altText?: string | null;
};

export type StrapiSlideshow = {
  id?: number;
  title?: string | null;
  autoplay?: boolean;
  intervalMs?: number;
  slides: StrapiSlide[];
};

export type StrapiSeo = {
  metaTitle?: string | null;
  metaDescription?: string | null;
  ogImage?: StrapiMedia | null;
};

export type BlocksHero = {
  __component: 'blocks.hero';
  id: number;
  eyebrow?: string | null;
  headline: string;
  subheadline?: string | null;
  backgroundMedia?: StrapiMedia | null;
  cta?: StrapiLink | null;
};

export type BlocksRichText = {
  __component: 'blocks.rich-text';
  id: number;
  title?: string | null;
  body: unknown;
};

export type BlocksFeatureItem = {
  id?: number;
  title: string;
  description?: string | null;
  icon?: string | null;
  image?: StrapiMedia | null;
  link?: StrapiLink | null;
};

export type BlocksFeatureGrid = {
  __component: 'blocks.feature-grid';
  id: number;
  title?: string | null;
  intro?: string | null;
  items?: BlocksFeatureItem[];
};

export type BlocksMediaGallery = {
  __component: 'blocks.media-gallery';
  id: number;
  slideshow: StrapiSlideshow;
};

export type BlocksLocationMap = {
  __component: 'blocks.location-map';
  id: number;
  title?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  mapEmbedUrl?: string | null;
  directionsLabel?: string | null;
};

export type BlocksBookingCta = {
  __component: 'blocks.booking-cta';
  id: number;
  headline: string;
  body?: string | null;
  bookingUrl: string;
  buttonLabel?: string | null;
  backgroundImage?: StrapiMedia | null;
};

export type BlocksContactForm = {
  __component: 'blocks.contact-form';
  id: number;
  title?: string | null;
  intro?: string | null;
  submitLabel?: string | null;
  successMessage?: string | null;
  recipientEmail?: string | null;
};

export type BlocksVideoEmbed = {
  __component: 'blocks.video-embed';
  id: number;
  title?: string | null;
  caption?: string | null;
  videoUrl?: string | null;
  videoFile?: StrapiMedia | null;
  poster?: StrapiMedia | null;
};

export type PageSection =
  | BlocksHero
  | BlocksRichText
  | BlocksFeatureGrid
  | BlocksMediaGallery
  | BlocksLocationMap
  | BlocksBookingCta
  | BlocksContactForm
  | BlocksVideoEmbed;

export type CmsPage = {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  navLabel?: string | null;
  styledCopy?: unknown;
  slideshows?: StrapiSlideshow[] | null;
  sections?: PageSection[] | null;
  seo?: StrapiSeo | null;
  locale?: string;
};

export type NavItem = {
  id?: number;
  label: string;
  url: string;
  order?: number;
};

export type Navigation = {
  items?: NavItem[] | null;
};

export type GlobalSettings = {
  siteName: string;
  tagline?: string | null;
  logo?: StrapiMedia | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  address?: string | null;
  defaultSeo?: StrapiSeo | null;
};
