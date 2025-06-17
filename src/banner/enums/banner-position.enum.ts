import { registerEnumType } from '@nestjs/graphql';
import { BannerPosition } from '@prisma/client';

// Define a type that includes all the values we want to use
export type ExtendedBannerPosition =
  | BannerPosition
  | 'SERVICE_PAGE'
  | 'BLOG_PAGE'
  | 'ABOUT_PAGE'
  | 'CONTACT_PAGE'
  | 'CUSTOM';

registerEnumType(BannerPosition, {
  name: 'BannerPosition',
  description: 'The position where the banner will be displayed',
  valuesMap: {
    HOMEPAGE: {
      description: 'Homepage banners',
    },
    SEARCH_RESULTS: {
      description: 'Search results page banners',
    },
    DETAIL_PAGE: {
      description: 'Detail page banners',
    },
    SIDEBAR: {
      description: 'Sidebar banners',
    },
  },
});

export { BannerPosition };
