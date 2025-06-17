import { registerEnumType } from '@nestjs/graphql';
import { BannerType } from '@prisma/client';

// Define a type that includes all the values we want to use
export type ExtendedBannerType = BannerType | 'SEASONAL' | 'CUSTOM';

registerEnumType(BannerType, {
  name: 'BannerType',
  description: 'The type of banner content',
  valuesMap: {
    HERO: {
      description: 'Large hero banners for main promotions',
    },
    SLIDER: {
      description: 'Slider banners',
    },
    PROMO: {
      description: 'Promotional banners',
    },
    ANNOUNCEMENT: {
      description: 'Announcement banners',
    },
  },
});

export { BannerType };
