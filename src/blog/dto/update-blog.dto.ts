import { PartialType, OmitType } from '@nestjs/mapped-types'; // Added OmitType
import { CreateBlogDto } from './create-blog.dto';
import {
  IsOptional,
  IsString,
  IsDate,
  IsEnum,
  IsBoolean,
  IsUUID,
  ValidateIf,
} from 'class-validator';
import { BlogStatus } from '@prisma/client';

// Helper class: CreateBlogDto without audio fields, all properties optional
class BaseBlogUpdateDto extends PartialType(
  OmitType(CreateBlogDto, ['audioFileMaleId', 'audioFileFemaleId'] as const),
) {}

export class UpdateBlogDto extends BaseBlogUpdateDto {
  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsDate()
  publishedAt?: Date;

  @IsOptional()
  @IsBoolean()
  isDeleted?: boolean;

  @IsOptional()
  @IsEnum(BlogStatus)
  status?: BlogStatus;

  @IsOptional()
  @ValidateIf((o, v) => v !== null)
  @IsUUID()
  audioFileMaleId?: string | null;

  @IsOptional()
  @ValidateIf((o, v) => v !== null)
  @IsUUID()
  audioFileFemaleId?: string | null;
}
