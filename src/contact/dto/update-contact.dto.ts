import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ContactStatus } from '@prisma/client';

export class UpdateContactDto {
  @IsOptional()
  @IsEnum(ContactStatus)
  status?: ContactStatus;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
