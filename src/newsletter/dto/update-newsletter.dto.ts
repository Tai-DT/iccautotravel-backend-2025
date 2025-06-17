import { IsOptional, IsObject, IsEnum } from 'class-validator';
import { NewsletterStatus } from '@prisma/client';

export class UpdateNewsletterDto {
  @IsOptional()
  @IsEnum(NewsletterStatus)
  status?: NewsletterStatus;

  @IsOptional()
  @IsObject()
  preferences?: {
    languages?: string[];
    topics?: string[];
    frequency?: 'daily' | 'weekly' | 'monthly';
  };
}
