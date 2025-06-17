import { IsEmail, IsOptional, IsObject } from 'class-validator';

export class CreateNewsletterDto {
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsObject()
  preferences?: {
    languages?: string[];
    topics?: string[];
    frequency?: 'daily' | 'weekly' | 'monthly';
  };
}
