import { IsOptional, IsObject, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export interface MultilingualText {
  vi?: string;
  en?: string;
  ko?: string;
}

export interface MultilingualArray {
  vi?: string[];
  en?: string[];
  ko?: string[];
}

export class UpdateMultilingualServiceDetailDto {
  @ApiPropertyOptional({
    description: 'Multilingual service name',
    example: {
      vi: 'Thuê xe Toyota Camry',
      en: 'Toyota Camry Rental',
      ko: '도요타 캠리 렌탈',
    },
  })
  @IsOptional()
  @IsObject()
  name?: MultilingualText;

  @ApiPropertyOptional({
    description: 'Multilingual service description',
    example: {
      vi: 'Xe sang trọng cho doanh nhân',
      en: 'Luxury car for business',
      ko: '비즈니스용 럭셔리 자동차',
    },
  })
  @IsOptional()
  @IsObject()
  description?: MultilingualText;

  // Vehicle-specific multilingual fields
  @ApiPropertyOptional({ description: 'Multilingual vehicle type' })
  @IsOptional()
  @IsObject()
  vehicleType?: MultilingualText;

  @ApiPropertyOptional({ description: 'Multilingual features list' })
  @IsOptional()
  @IsObject()
  features?: MultilingualArray;

  // Hotel-specific multilingual fields
  @ApiPropertyOptional({ description: 'Multilingual hotel name' })
  @IsOptional()
  @IsObject()
  hotelName?: MultilingualText;

  @ApiPropertyOptional({ description: 'Multilingual room type' })
  @IsOptional()
  @IsObject()
  roomType?: MultilingualText;

  @ApiPropertyOptional({ description: 'Multilingual amenities list' })
  @IsOptional()
  @IsObject()
  amenities?: MultilingualArray;

  @ApiPropertyOptional({ description: 'Multilingual address' })
  @IsOptional()
  @IsObject()
  address?: MultilingualText;

  // Tour-specific multilingual fields
  @ApiPropertyOptional({ description: 'Multilingual tour name' })
  @IsOptional()
  @IsObject()
  tourName?: MultilingualText;

  @ApiPropertyOptional({ description: 'Multilingual itinerary' })
  @IsOptional()
  @IsObject()
  itinerary?: Record<string, MultilingualText>; // day1: {vi: '', en: '', ko: ''}

  @ApiPropertyOptional({ description: 'Multilingual includes list' })
  @IsOptional()
  @IsObject()
  includes?: MultilingualArray;

  @ApiPropertyOptional({ description: 'Multilingual excludes list' })
  @IsOptional()
  @IsObject()
  excludes?: MultilingualArray;

  // Flight-specific multilingual fields
  @ApiPropertyOptional({ description: 'Multilingual airline name' })
  @IsOptional()
  @IsObject()
  airlineName?: MultilingualText;

  @ApiPropertyOptional({ description: 'Multilingual departure location' })
  @IsOptional()
  @IsObject()
  departureLocation?: MultilingualText;

  @ApiPropertyOptional({ description: 'Multilingual arrival location' })
  @IsOptional()
  @IsObject()
  arrivalLocation?: MultilingualText;
}

export class GetLocalizedServiceDetailDto {
  @ApiPropertyOptional({
    description: 'Language code',
    enum: ['vi', 'en', 'ko'],
    default: 'vi',
  })
  @IsOptional()
  @IsString()
  lang?: 'vi' | 'en' | 'ko' = 'vi';
}
