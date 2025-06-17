import {
  IsString,
  MaxLength,
  IsOptional,
  IsInt,
  Min,
  IsUUID,
  IsBoolean,
} from 'class-validator';

export class CreateFaqDto {
  @IsString()
  @MaxLength(500)
  question!: string;

  @IsString()
  @MaxLength(2000)
  answer!: string;

  @IsString()
  @MaxLength(5)
  lang!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsUUID()
  audioFileMaleId?: string;

  @IsOptional()
  @IsUUID()
  audioFileFemaleId?: string;
}
