import { IsOptional, IsBoolean, IsString } from 'class-validator';

export class SEOConfigFilterDto {
  @IsOptional()
  @IsString()
  page?: string;

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
