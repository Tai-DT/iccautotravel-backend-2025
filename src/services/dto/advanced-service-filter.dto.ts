import {
  IsOptional,
  IsString,
  IsNumber,
  IsArray,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ServiceType } from '@prisma/client';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AdvancedServiceFilterDto {
  @ApiPropertyOptional({ description: 'Search text for name and description' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    enum: ServiceType,
    description: 'Service type filter',
  })
  @IsOptional()
  @IsEnum(ServiceType)
  type?: ServiceType;

  @ApiPropertyOptional({ description: 'Filter active/inactive services' })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;

  // Vehicle Filters
  @ApiPropertyOptional({ description: 'Vehicle brand filter' })
  @IsOptional()
  @IsString()
  vehicleBrand?: string;

  @ApiPropertyOptional({ description: 'Vehicle type filter' })
  @IsOptional()
  @IsString()
  vehicleType?: string;

  @ApiPropertyOptional({ description: 'Minimum seats' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  minSeats?: number;

  @ApiPropertyOptional({ description: 'Maximum seats' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  maxSeats?: number;

  @ApiPropertyOptional({ description: 'Fuel type filter' })
  @IsOptional()
  @IsString()
  fuelType?: string;

  // Hotel Filters
  @ApiPropertyOptional({ description: 'Minimum star rating' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  minStarRating?: number;

  @ApiPropertyOptional({ description: 'Maximum star rating' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  maxStarRating?: number;

  @ApiPropertyOptional({ description: 'Hotel city filter' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({
    description: 'Hotel amenities filter',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];

  // Tour Filters
  @ApiPropertyOptional({ description: 'Minimum tour duration in days' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  minDuration?: number;

  @ApiPropertyOptional({ description: 'Maximum tour duration in days' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  maxDuration?: number;

  @ApiPropertyOptional({ description: 'Minimum adult price' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  minAdultPrice?: number;

  @ApiPropertyOptional({ description: 'Maximum adult price' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  maxAdultPrice?: number;

  // Flight Filters
  @ApiPropertyOptional({ description: 'Airline filter' })
  @IsOptional()
  @IsString()
  airline?: string;

  @ApiPropertyOptional({ description: 'Departure airport code' })
  @IsOptional()
  @IsString()
  depAirportCode?: string;

  @ApiPropertyOptional({ description: 'Arrival airport code' })
  @IsOptional()
  @IsString()
  arrAirportCode?: string;

  @ApiPropertyOptional({ description: 'Fare class filter' })
  @IsOptional()
  @IsString()
  fareClass?: string;

  // General Price Filters
  @ApiPropertyOptional({ description: 'Minimum price' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  minPrice?: number;

  @ApiPropertyOptional({ description: 'Maximum price' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  maxPrice?: number;

  // Pagination
  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 10 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number = 10;

  // Sorting
  @ApiPropertyOptional({
    description: 'Sort field',
    enum: ['name', 'price', 'createdAt', 'updatedAt'],
  })
  @IsOptional()
  @IsString()
  sortBy?: 'name' | 'price' | 'createdAt' | 'updatedAt' = 'createdAt';

  @ApiPropertyOptional({ description: 'Sort direction', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
