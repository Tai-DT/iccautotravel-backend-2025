import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsArray,
  IsDate,
  IsNotEmpty,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
export enum ReviewStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  HIDDEN = 'HIDDEN',
}

export class CreateServiceReviewDto {
  @IsString()
  @IsNotEmpty()
  serviceId!: string;

  @IsString()
  @IsOptional()
  bookingId?: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  comment?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  photos?: string[];

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  usageDate?: Date;
}

export class UpdateServiceReviewDto {
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(5)
  rating?: number;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  comment?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  photos?: string[];

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  usageDate?: Date;

  @IsEnum(ReviewStatus)
  @IsOptional()
  status?: ReviewStatus;
}

export class ServiceReviewFilterDto {
  @IsOptional()
  page?: number = 1;

  @IsOptional()
  limit?: number = 10;

  @IsString()
  @IsOptional()
  serviceId?: string;

  @IsString()
  @IsOptional()
  userId?: string;

  @IsEnum(ReviewStatus)
  @IsOptional()
  status?: ReviewStatus;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(5)
  minRating?: number;

  @IsString()
  @IsOptional()
  sortBy?: string = 'createdAt';

  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
