import {
  IsString,
  IsOptional,
  IsNumber,
  IsUUID,
  IsArray,
  IsDateString,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateTourDetailDto {
  @ApiPropertyOptional({
    description:
      'Service ID to link this detail to (optional, will create new service if not provided)',
  })
  @IsOptional()
  @IsUUID()
  serviceId?: string;

  @ApiPropertyOptional({
    description: 'Tour code (will be auto-generated if not provided)',
    example: 'TOUR-HALONG-01',
  })
  @IsOptional()
  @IsString()
  tourCode?: string;

  @ApiPropertyOptional({
    description: 'Detailed itinerary',
  })
  @IsOptional()
  itinerary?: any;

  @ApiPropertyOptional({
    description: 'Available departure dates',
    example: ['2025-07-01', '2025-07-15', '2025-08-01'],
  })
  @IsOptional()
  @IsArray()
  @IsDateString({}, { each: true })
  departureDates?: string[];

  @ApiProperty({
    description: 'Price per adult',
    example: 1500000,
  })
  @IsNumber()
  @Type(() => Number)
  adultPrice: number;

  @ApiPropertyOptional({
    description: 'Price per child',
    example: 1000000,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  childPrice?: number;

  @ApiProperty({
    description: 'Available seats',
    example: 20,
  })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  seatsAvailable: number;

  @ApiPropertyOptional({
    description: 'Minimum number of passengers',
    example: 2,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  minPax?: number;

  @ApiPropertyOptional({
    description: 'Maximum number of passengers',
    example: 30,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  maxPax?: number;

  @ApiPropertyOptional({
    description: 'Duration in days',
    example: 3,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  durationInDays?: number;

  @ApiPropertyOptional({
    description: 'Tour description',
    example: 'Explore the beautiful Ha Long Bay with overnight cruise',
  })
  @IsOptional()
  @IsString()
  description?: string;

  // Service data (if creating new service)
  @ApiPropertyOptional({
    description: 'Service name (required if not providing serviceId)',
    example: 'Ha Long Bay 3D2N Tour',
  })
  @IsOptional()
  @IsString()
  serviceName?: string;

  @ApiPropertyOptional({
    description: 'Service description (for new service)',
    example: 'Beautiful 3-day tour to Ha Long Bay with overnight cruise',
  })
  @IsOptional()
  @IsString()
  serviceDescription?: string;

  @ApiPropertyOptional({
    description: 'Whether the service is active',
    default: true,
  })
  @IsOptional()
  isActive?: boolean;
}
