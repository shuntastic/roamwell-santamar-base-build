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
  description?: unknown;
  backgroundMedia?: StrapiMedia | null;
  showGradient?: boolean | null;
  cta?: StrapiLink | null;
};

export type BlocksRichText = {
  __component: 'blocks.rich-text';
  id: number;
  title?: string | null;
  body: unknown;
};

export type BlocksStatement = {
  __component: 'blocks.statement';
  id: number;
  title: string;
  body?: string | null;
};

export type BlocksImageText = {
  __component: 'blocks.image-text';
  id: number;
  title?: string | null;
  subheadline?: string | null;
  body?: unknown;
  images: StrapiMedia[];
  autoplay?: boolean | null;
  intervalMs?: number | null;
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

export type BlocksBookingCalendar = {
  __component: 'blocks.booking-calendar';
  id: number;
  title?: string | null;
  cloudfrontSubdomain: string;
  baseUrl: string;
  listingId: number;
  numberOfMonths?: '1' | '2' | null;
  openInNewTab?: boolean | null;
  buttonAction?: 'checkout' | 'inquiry' | null;
  buttonText?: string | null;
  clearButtonText?: string | null;
  font?: string | null;
  rounded?: boolean | null;
  mainColor?: string | null;
  frameColor?: string | null;
  textColor?: string | null;
};

export type BlocksContactForm = {
  __component: 'blocks.contact-form';
  id: number;
  title?: string | null;
  intro?: string | null;
  image?: StrapiMedia | null;
  submitLabel?: string | null;
  successMessage?: string | null;
  recipientEmail?: string | null;
};

export type BlocksModalButton = {
  __component: 'blocks.modal-button';
  id: number;
  description?: string | null;
  buttonLabel: string;
  buttonVariant?: 'primary' | 'secondary' | 'text' | null;
  modalTitle?: string | null;
  modalContent: unknown;
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
  | BlocksStatement
  | BlocksImageText
  | BlocksFeatureGrid
  | BlocksMediaGallery
  | BlocksLocationMap
  | BlocksBookingCta
  | BlocksBookingCalendar
  | BlocksContactForm
  | BlocksModalButton
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
