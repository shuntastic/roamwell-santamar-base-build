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
  buttons?: StrapiCtaButton[] | null;
};

export type BlocksStatement = {
  __component: 'blocks.statement';
  id: number;
  title: string;
  body?: string | null;
  buttons?: StrapiCtaButton[] | null;
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

/** Media Categories collection entry linked from a grid filter or item. */
export type MediaCategoryRef = {
  id?: number;
  documentId?: string;
  categoryname?: string | null;
};

/** Repeatable category slot on a media grid or media item. */
export type BlocksMediaGridCategory = {
  id?: number;
  media_categories?: MediaCategoryRef[] | MediaCategoryRef | null;
};

export type BlocksMediaGridItem = {
  id?: number;
  media?: StrapiMedia | StrapiMedia[] | null;
  poster?: StrapiMedia | StrapiMedia[] | null;
  title?: string | null;
  caption?: string | null;
  categories?: BlocksMediaGridCategory[] | BlocksMediaGridCategory | null;
};

export type BlocksMediaGrid = {
  __component: 'blocks.media-grid';
  id: number;
  title?: string | null;
  maxColumns?: number | null;
  showItemTitles?: boolean | null;
  categories?: BlocksMediaGridCategory[] | BlocksMediaGridCategory | null;
  items?: BlocksMediaGridItem[] | null;
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
  embedCode: string;
};

export type BlocksBookingSearch = {
  __component: 'blocks.booking-search';
  id: number;
  title?: string | null;
  embedCode: string;
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

/** Recipients are private in the CMS and never reach the browser; `id` identifies the form on submit. */
export type BlocksProductionInquiryForm = {
  __component: 'blocks.production-inquiry-form';
  id: number;
  title?: string | null;
  intro?: string | null;
  submitLabel?: string | null;
  successMessage?: string | null;
};

export type StrapiCtaButton = {
  id?: number;
  label: string;
  url: string;
  openInNewTab?: boolean | null;
  size?: 'small' | 'medium' | 'large' | null;
  style?: 'primary' | 'secondary' | 'text' | null;
};

export type BlocksCtaButtons = {
  __component: 'blocks.cta-buttons';
  id: number;
  buttons?: StrapiCtaButton[] | null;
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
  | BlocksMediaGrid
  | BlocksLocationMap
  | BlocksBookingCta
  | BlocksBookingCalendar
  | BlocksBookingSearch
  | BlocksContactForm
  | BlocksProductionInquiryForm
  | BlocksCtaButtons
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

export type SiteTemplate = 'multi_page' | 'single_page';

export type SiteTheme = 'coastal' | 'harbor' | 'dune' | 'blackbox';

export type Site = {
  id: number;
  documentId: string;
  name: string;
  key: string;
  hostname: string;
  hostnames?: string[] | null;
  isPrimary?: boolean | null;
  template: SiteTemplate;
  theme?: SiteTheme | null;
  siteName: string;
  tagline?: string | null;
  logo?: StrapiMedia | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  address?: string | null;
  instagramUrl?: string | null;
  defaultSeo?: StrapiSeo | null;
};

/** Page relation populated on a nav item (identity only — not the full page body). */
export type NavItemPage = {
  id?: number;
  documentId?: string;
  title?: string;
  slug?: string;
  navLabel?: string | null;
};

export type NavItem = {
  id?: number;
  label: string;
  url?: string | null;
  order?: number;
  targetType?: 'page' | 'section' | null;
  sectionAnchor?: string | null;
  page?: NavItemPage | null;
};

export type Navigation = {
  items?: NavItem[] | null;
};

/** Brand/contact fields for chrome (header/footer) — sourced from Site. */
export type GlobalSettings = Pick<
  Site,
  | 'siteName'
  | 'tagline'
  | 'logo'
  | 'contactEmail'
  | 'contactPhone'
  | 'address'
  | 'instagramUrl'
  | 'defaultSeo'
>;
