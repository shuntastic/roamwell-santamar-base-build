import type { Schema, Struct } from '@strapi/strapi';

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

export interface BlocksContactForm extends Struct.ComponentSchema {
  collectionName: 'components_blocks_contact_forms';
  info: {
    description: 'Contact form configuration (EN/ES/PT copy via page locale)';
    displayName: 'Contact Form';
    icon: 'envelope';
  };
  attributes: {
    intro: Schema.Attribute.Text;
    recipientEmail: Schema.Attribute.Email;
    submitLabel: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Send Message'>;
    successMessage: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Thank you. We will be in touch soon.'>;
    title: Schema.Attribute.String;
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
    subheadline: Schema.Attribute.Text;
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

export interface BlocksRichText extends Struct.ComponentSchema {
  collectionName: 'components_blocks_rich_texts';
  info: {
    description: 'Styled copy block for long-form content';
    displayName: 'Rich Text';
    icon: 'write';
  };
  attributes: {
    body: Schema.Attribute.Blocks & Schema.Attribute.Required;
    title: Schema.Attribute.String;
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
    description: 'Primary navigation item';
    displayName: 'Nav Item';
    icon: 'bulletList';
  };
  attributes: {
    label: Schema.Attribute.String & Schema.Attribute.Required;
    order: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    page: Schema.Attribute.Relation<'oneToOne', 'api::page.page'>;
    url: Schema.Attribute.String & Schema.Attribute.Required;
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
      'blocks.booking-cta': BlocksBookingCta;
      'blocks.contact-form': BlocksContactForm;
      'blocks.feature-grid': BlocksFeatureGrid;
      'blocks.feature-item': BlocksFeatureItem;
      'blocks.hero': BlocksHero;
      'blocks.location-map': BlocksLocationMap;
      'blocks.media-gallery': BlocksMediaGallery;
      'blocks.rich-text': BlocksRichText;
      'blocks.video-embed': BlocksVideoEmbed;
      'media.slide': MediaSlide;
      'media.slideshow': MediaSlideshow;
      'shared.link': SharedLink;
      'shared.nav-item': SharedNavItem;
      'shared.seo': SharedSeo;
    }
  }
}
