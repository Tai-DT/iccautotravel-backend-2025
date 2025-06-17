import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateFaqDto } from './create-faq.dto';
import { IsOptional, IsUUID, ValidateIf, IsBoolean } from 'class-validator';

// Helper class: CreateFaqDto without audio fields, all properties optional
class BaseFaqUpdateDto extends PartialType(
  OmitType(CreateFaqDto, ['audioFileMaleId', 'audioFileFemaleId'] as const),
) {}

export class UpdateFaqDto extends BaseFaqUpdateDto {
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
}
