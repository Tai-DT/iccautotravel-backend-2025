import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsUUID,
  ValidateNested,
  IsArray,
  IsNumber,
  Min,
} from 'class-validator';
import { ServiceType } from '@prisma/client';
import { Type } from 'class-transformer';

// Define sub-DTOs for each service detail type if they have specific create-time fields
// For now, assuming metadata will handle most details, or they are set via separate endpoints.

export class CreateServiceDto {
  @IsEnum(ServiceType)
  type!: ServiceType;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  duration?: number;

  @IsOptional()
  @IsString()
  durationUnit?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  allowPayLater?: boolean;

  @IsOptional()
  @IsUUID()
  audioFileMaleId?: string;

  @IsOptional()
  @IsUUID()
  audioFileFemaleId?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  highlights?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  localizedTypeName?: string;

  @IsOptional()
  @IsBoolean()
  isDeleted?: boolean;

  @IsOptional()
  metadata?: any; // Consider using a more specific type or class-validator for metadata structure

  // Placeholder for detailed service type information, to be expanded as needed
  // Example for TourServiceDetail specific fields, if any, during creation:
  // @IsOptional()
  // @ValidateNested()
  // @Type(() => CreateTourServiceDetailDto) // Assuming CreateTourServiceDetailDto exists
  // tourDetail?: CreateTourServiceDetailDto;
}
