import { IsOptional, IsEnum, IsBoolean, IsString } from 'class-validator';
import { BannerPosition, BannerType } from '@prisma/client';

export class BannerFilterDto {
  @IsOptional()
  @IsEnum(BannerPosition)
  position?: BannerPosition;

  @IsOptional()
  @IsEnum(BannerType)
  type?: BannerType;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  lang?: string;

  @IsOptional()
  @IsString()
  search?: string;
}
