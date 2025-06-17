import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateServiceDto } from './create-service.dto';
import { IsOptional, IsUUID, ValidateIf, IsBoolean } from 'class-validator';

// Helper class: CreateServiceDto without audio fields, all properties optional
class BaseServiceUpdateDto extends PartialType(
  OmitType(CreateServiceDto, ['audioFileMaleId', 'audioFileFemaleId'] as const),
) {}

export class UpdateServiceDto extends BaseServiceUpdateDto {
  @IsOptional()
  @ValidateIf((o, v) => v !== null)
  @IsUUID()
  audioFileMaleId?: string | null;

  @IsOptional()
  @ValidateIf((o, v) => v !== null)
  @IsUUID()
  audioFileFemaleId?: string | null;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;
}
