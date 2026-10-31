import type { Schema, Struct } from '@strapi/strapi';

export interface BlocksBookingCalendar extends Struct.ComponentSchema {
  collectionName: 'components_blocks_booking_calendars';
  info: {
    description: 'Paste Hostaway calendar embed code (div + script tags from Hostaway)';
    displayName: 'Booking Calendar';
    icon: 'calendar';
  };
  attributes: {
    embedCode: Schema.Attribute.Text & Schema.Attribute.Required;
    title: Schema.Attribute.String;
  };
}

export interface BlocksBookingCta extends Struct.ComponentSchema {
  collectionName: 'components_blocks_booking_ctas';
  info: {
    description: 'Call-to-action for Book Your Stay';
    displayName: 'Booking CTA';
    icon: 'calendar';
  };
  attributes: {
    backgroundImage: Schema.Attribute.Media<'images'>;
    body: Schema.Attribute.Text;
    bookingUrl: Schema.Attribute.String & Schema.Attribute.Required;
    buttonLabel: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Book Your Stay'>;
    headline: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface BlocksBookingSearch extends Struct.ComponentSchema {
  collectionName: 'components_blocks_booking_searches';
  info: {
    description: 'Paste Hostaway search / booking bar embed code (div + script tags from Hostaway)';
    displayName: 'Booking Search';
    icon: 'search';
  };
  attributes: {
    embedCode: Schema.Attribute.Text & Schema.Attribute.Required;
    title: Schema.Attribute.String;
  };
}

export interface BlocksContactForm extends Struct.ComponentSchema {
  collectionName: 'components_blocks_contact_forms';
  info: {
    description: 'Split contact section with image on the left and form on the right (EN/ES/PT copy via page locale)';
    displayName: 'Contact Form';
    icon: 'envelope';
  };
  attributes: {
    image: Schema.Attribute.Media<'images'>;
    intro: Schema.Attribute.Text;
    recipientEmail: Schema.Attribute.Email;
    submitLabel: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Send Message'>;
    successMessage: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Thank you. We will be in touch soon.'>;
    title: Schema.Attribute.String;
  };
}

export interface BlocksCtaButtons extends Struct.ComponentSchema {
  collectionName: 'components_blocks_cta_buttons';
  info: {
    description: 'A centered row of up to three call-to-action buttons';
    displayName: 'CTA Buttons';
    icon: 'cursor';
  };
  attributes: {
    buttons: Schema.Attribute.Component<'shared.cta-button', true> &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          max: 3;
          min: 1;
        },
        number
      >;
  };
}

export interface BlocksFeatureGrid extends Struct.ComponentSchema {
  collectionName: 'components_blocks_feature_grids';
  info: {
    description: 'Grid of feature cards for accommodations, activities, etc.';
    displayName: 'Feature Grid';
    icon: 'grid';
  };
  attributes: {
    intro: Schema.Attribute.Text;
    items: Schema.Attribute.Component<'blocks.feature-item', true>;
    title: Schema.Attribute.String;
  };
}

export interface BlocksFeatureItem extends Struct.ComponentSchema {
  collectionName: 'components_blocks_feature_items';
  info: {
    displayName: 'Feature Item';
    icon: 'star';
  };
  attributes: {
    description: Schema.Attribute.Text;
    icon: Schema.Attribute.String;
    image: Schema.Attribute.Media<'images'>;
    link: Schema.Attribute.Component<'shared.link', false>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface BlocksHero extends Struct.ComponentSchema {
  collectionName: 'components_blocks_heroes';
  info: {
    description: 'Full-bleed hero with headline and optional media';
    displayName: 'Hero';
    icon: 'picture';
  };
  attributes: {
    backgroundMedia: Schema.Attribute.Media<'images' | 'videos'>;
    cta: Schema.Attribute.Component<'shared.link', false>;
    description: Schema.Attribute.Blocks;
    eyebrow: Schema.Attribute.String;
    headline: Schema.Attribute.String & Schema.Attribute.Required;
    showGradient: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    subheadline: Schema.Attribute.Text;
  };
}

export interface BlocksImageText extends Struct.ComponentSchema {
  collectionName: 'components_blocks_image_texts';
  info: {
    description: 'Split layout with one or more images on the left and optional title, subheadline, and copy on the right';
    displayName: 'Image & Text';
    icon: 'picture';
  };
  attributes: {
    autoplay: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    body: Schema.Attribute.Blocks;
    images: Schema.Attribute.Media<'images', true> & Schema.Attribute.Required;
    intervalMs: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          min: 1000;
        },
        number
      > &
      Schema.Attribute.DefaultTo<5000>;
    subheadline: Schema.Attribute.Text;
    title: Schema.Attribute.String;
  };
}

export interface BlocksLocationMap extends Struct.ComponentSchema {
  collectionName: 'components_blocks_location_maps';
  info: {
    description: 'Map embed with address details';
    displayName: 'Location Map';
    icon: 'pinMap';
  };
  attributes: {
    address: Schema.Attribute.Text;
    directionsLabel: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Get Directions'>;
    latitude: Schema.Attribute.Decimal;
    longitude: Schema.Attribute.Decimal;
    mapEmbedUrl: Schema.Attribute.String;
    title: Schema.Attribute.String;
  };
}

export interface BlocksMediaGallery extends Struct.ComponentSchema {
  collectionName: 'components_blocks_media_galleries';
  info: {
    description: 'Standalone slideshow block for dynamic zones';
    displayName: 'Media Gallery';
    icon: 'landscape';
  };
  attributes: {
    slideshow: Schema.Attribute.Component<'media.slideshow', false> &
      Schema.Attribute.Required;
  };
}

export interface BlocksMediaGrid extends Struct.ComponentSchema {
  collectionName: 'components_blocks_media_grids';
  info: {
    description: 'Filterable grid of images and videos. A tile opens a lightbox with previous and next controls.';
    displayName: 'Media Grid';
    icon: 'apps';
  };
  attributes: {
    categories: Schema.Attribute.Component<'blocks.media-grid-category', true>;
    items: Schema.Attribute.Component<'blocks.media-grid-item', true>;
    maxColumns: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          max: 6;
          min: 1;
        },
        number
      > &
      Schema.Attribute.DefaultTo<3>;
    showItemTitles: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    title: Schema.Attribute.String;
  };
}

export interface BlocksMediaGridCategory extends Struct.ComponentSchema {
  collectionName: 'components_blocks_media_grid_categories';
  info: {
    description: 'Filter label for a media grid';
    displayName: 'Media Category';
    icon: 'priceTag';
  };
  attributes: {
    media_categories: Schema.Attribute.Relation<
      'oneToMany',
      'api::media-category.media-category'
    >;
  };
}

export interface BlocksMediaGridItem extends Struct.ComponentSchema {
  collectionName: 'components_blocks_media_grid_items';
  info: {
    description: 'Image or video in a media grid, with an optional lightbox title and caption';
    displayName: 'Media Item';
    icon: 'picture';
  };
  attributes: {
    caption: Schema.Attribute.Text;
    categories: Schema.Attribute.Component<'blocks.media-grid-category', true>;
    media: Schema.Attribute.Media<'images' | 'videos'> &
      Schema.Attribute.Required;
    poster: Schema.Attribute.Media<'images'>;
    title: Schema.Attribute.String;
  };
}

export interface BlocksModalButton extends Struct.ComponentSchema {
  collectionName: 'components_blocks_modal_buttons';
  info: {
    description: 'Optional description with a button that opens a modal of rich HTML copy';
    displayName: 'Modal Button';
    icon: 'expand';
  };
  attributes: {
    buttonLabel: Schema.Attribute.String & Schema.Attribute.Required;
    buttonVariant: Schema.Attribute.Enumeration<
      ['primary', 'secondary', 'text']
    > &
      Schema.Attribute.DefaultTo<'primary'>;
    description: Schema.Attribute.Text;
    modalContent: Schema.Attribute.Blocks & Schema.Attribute.Required;
    modalTitle: Schema.Attribute.String;
  };
}

export interface BlocksProductionInquiryForm extends Struct.ComponentSchema {
  collectionName: 'components_blocks_production_inquiry_forms';
  info: {
    description: 'Location / production booking inquiry form. Submissions are emailed to the recipients below and saved under Production Inquiries.';
    displayName: 'Production Inquiry Form';
    icon: 'file';
  };
  attributes: {
    intro: Schema.Attribute.Text &
      Schema.Attribute.DefaultTo<'Have a project in mind? Send us a few production details and we\u2019ll get back to you with availability and a quote. Rates are based on production type, crew size, hours, usage, and location requirements.\n\nScouting visits are available by appointment.'>;
    recipients: Schema.Attribute.Component<'shared.email-recipient', true> &
      Schema.Attribute.Required &
      Schema.Attribute.Private &
      Schema.Attribute.SetMinMax<
        {
          max: 10;
          min: 1;
        },
        number
      >;
    submitLabel: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Check Availability'>;
    successMessage: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Thank you. Our production team will be in touch shortly.'>;
    title: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Check Availability'>;
  };
}

export interface BlocksRichText extends Struct.ComponentSchema {
  collectionName: 'components_blocks_rich_texts';
  info: {
    description: 'Styled copy block for long-form content, with up to three optional buttons';
    displayName: 'Rich Text';
    icon: 'write';
  };
  attributes: {
    body: Schema.Attribute.Blocks & Schema.Attribute.Required;
    buttons: Schema.Attribute.Component<'shared.cta-button', true> &
      Schema.Attribute.SetMinMax<
        {
          max: 3;
        },
        number
      >;
    title: Schema.Attribute.String;
  };
}

export interface BlocksStatement extends Struct.ComponentSchema {
  collectionName: 'components_blocks_statements';
  info: {
    description: 'Centered statement text used as a section divider, with up to three optional buttons';
    displayName: 'Statement';
    icon: 'quote';
  };
  attributes: {
    body: Schema.Attribute.Text;
    buttons: Schema.Attribute.Component<'shared.cta-button', true> &
      Schema.Attribute.SetMinMax<
        {
          max: 3;
        },
        number
      >;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface BlocksVideoEmbed extends Struct.ComponentSchema {
  collectionName: 'components_blocks_video_embeds';
  info: {
    description: 'External or uploaded video with caption';
    displayName: 'Video Embed';
    icon: 'play';
  };
  attributes: {
    caption: Schema.Attribute.Text;
    poster: Schema.Attribute.Media<'images'>;
    title: Schema.Attribute.String;
    videoFile: Schema.Attribute.Media<'videos'>;
    videoUrl: Schema.Attribute.String;
  };
}

export interface MediaSlide extends Struct.ComponentSchema {
  collectionName: 'components_media_slides';
  info: {
    description: 'Single slideshow item with image or video and caption';
    displayName: 'Slide';
    icon: 'picture';
  };
  attributes: {
    altText: Schema.Attribute.String;
    caption: Schema.Attribute.Text;
    media: Schema.Attribute.Media<'images' | 'videos'> &
      Schema.Attribute.Required;
  };
}

export interface MediaSlideshow extends Struct.ComponentSchema {
  collectionName: 'components_media_slideshows';
  info: {
    description: 'Ordered slideshow of images or videos with captions';
    displayName: 'Slideshow';
    icon: 'landscape';
  };
  attributes: {
    autoplay: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    intervalMs: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          min: 1000;
        },
        number
      > &
      Schema.Attribute.DefaultTo<5000>;
    slides: Schema.Attribute.Component<'media.slide', true> &
      Schema.Attribute.Required;
    title: Schema.Attribute.String;
  };
}

export interface SharedCtaButton extends Struct.ComponentSchema {
  collectionName: 'components_shared_cta_buttons';
  info: {
    description: 'A single call-to-action button: label, destination, tab behavior, size, and style';
    displayName: 'CTA Button';
    icon: 'cursor';
  };
  attributes: {
    label: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 40;
      }>;
    openInNewTab: Schema.Attribute.Boolean &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<false>;
    size: Schema.Attribute.Enumeration<['small', 'medium', 'large']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'medium'>;
    style: Schema.Attribute.Enumeration<['primary', 'secondary', 'text']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'primary'>;
    url: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedEmailRecipient extends Struct.ComponentSchema {
  collectionName: 'components_shared_email_recipients';
  info: {
    description: 'An email address that receives form submissions';
    displayName: 'Email Recipient';
    icon: 'envelop';
  };
  attributes: {
    email: Schema.Attribute.Email & Schema.Attribute.Required;
  };
}

export interface SharedLink extends Struct.ComponentSchema {
  collectionName: 'components_shared_links';
  info: {
    description: 'Internal or external CTA link';
    displayName: 'Link';
    icon: 'link';
  };
  attributes: {
    label: Schema.Attribute.String & Schema.Attribute.Required;
    openInNewTab: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    url: Schema.Attribute.String & Schema.Attribute.Required;
    variant: Schema.Attribute.Enumeration<['primary', 'secondary', 'text']> &
      Schema.Attribute.DefaultTo<'primary'>;
  };
}

export interface SharedNavItem extends Struct.ComponentSchema {
  collectionName: 'components_shared_nav_items';
  info: {
    description: 'Navigation item \u2014 page route (multi_page) or section anchor (single_page)';
    displayName: 'Nav Item';
    icon: 'bulletList';
  };
  attributes: {
    label: Schema.Attribute.String & Schema.Attribute.Required;
    order: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    page: Schema.Attribute.Relation<'oneToOne', 'api::page.page'>;
    sectionAnchor: Schema.Attribute.String;
    targetType: Schema.Attribute.Enumeration<['page', 'section']> &
      Schema.Attribute.DefaultTo<'page'>;
    url: Schema.Attribute.String;
  };
}

export interface SharedSeo extends Struct.ComponentSchema {
  collectionName: 'components_shared_seos';
  info: {
    description: 'Page SEO metadata';
    displayName: 'SEO';
    icon: 'search';
  };
  attributes: {
    metaDescription: Schema.Attribute.Text &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 160;
      }>;
    metaTitle: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 70;
      }>;
    ogImage: Schema.Attribute.Media<'images'>;
  };
}

declare module '@strapi/strapi' {
  export namespace Public {
    export interface ComponentSchemas {
      'blocks.booking-calendar': BlocksBookingCalendar;
      'blocks.booking-cta': BlocksBookingCta;
      'blocks.booking-search': BlocksBookingSearch;
      'blocks.contact-form': BlocksContactForm;
      'blocks.cta-buttons': BlocksCtaButtons;
      'blocks.feature-grid': BlocksFeatureGrid;
      'blocks.feature-item': BlocksFeatureItem;
      'blocks.hero': BlocksHero;
      'blocks.image-text': BlocksImageText;
      'blocks.location-map': BlocksLocationMap;
      'blocks.media-gallery': BlocksMediaGallery;
      'blocks.media-grid': BlocksMediaGrid;
      'blocks.media-grid-category': BlocksMediaGridCategory;
      'blocks.media-grid-item': BlocksMediaGridItem;
      'blocks.modal-button': BlocksModalButton;
      'blocks.production-inquiry-form': BlocksProductionInquiryForm;
      'blocks.rich-text': BlocksRichText;
      'blocks.statement': BlocksStatement;
      'blocks.video-embed': BlocksVideoEmbed;
      'media.slide': MediaSlide;
      'media.slideshow': MediaSlideshow;
      'shared.cta-button': SharedCtaButton;
      'shared.email-recipient': SharedEmailRecipient;
      'shared.link': SharedLink;
      'shared.nav-item': SharedNavItem;
      'shared.seo': SharedSeo;
    }
  }
}
