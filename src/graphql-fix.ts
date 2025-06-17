import { registerEnumType } from '@nestjs/graphql';
import {
  ServiceType,
  ContactStatus,
  PaymentStatus,
  BookingStatus,
  ItineraryStatus,
  NewsletterStatus,
  BlogStatus,
  FileCategory,
} from '@prisma/client';
import { BannerType } from './banner/enums/banner-type.enum';
import { BannerPosition } from './banner/enums/banner-position.enum';
import { LocationType } from '@prisma/client';

// Đảm bảo tất cả các enum được đăng ký với GraphQL
export function registerAllEnums() {
  // Đăng ký các enum từ Prisma
  registerEnumType(ServiceType, {
    name: 'ServiceType',
    description: 'The type of service (FLIGHT, VEHICLE, HOTEL, etc.)',
  });

  registerEnumType(ContactStatus, {
    name: 'ContactStatus',
    description: 'The status of a contact message',
  });

  registerEnumType(PaymentStatus, {
    name: 'PaymentStatus',
    description: 'The status of a payment',
  });

  registerEnumType(BookingStatus, {
    name: 'BookingStatus',
    description: 'The status of a booking',
  });

  registerEnumType(ItineraryStatus, {
    name: 'ItineraryStatus',
    description: 'The status of an itinerary',
  });

  registerEnumType(NewsletterStatus, {
    name: 'NewsletterStatus',
    description: 'The status of a newsletter subscription',
  });

  registerEnumType(BlogStatus, {
    name: 'BlogStatus',
    description: 'The status of a blog post',
  });

  registerEnumType(FileCategory, {
    name: 'FileCategory',
    description: 'The category of a file',
  });

  // Role enum is handled separately in role constants

  registerEnumType(BannerType, {
    name: 'BannerType',
    description: 'Các loại banner',
  });

  registerEnumType(BannerPosition, {
    name: 'BannerPosition',
    description: 'Các vị trí banner',
  });

  registerEnumType(LocationType, {
    name: 'LocationType',
    description: 'Các loại địa điểm',
  });
}
