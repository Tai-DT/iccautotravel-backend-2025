// src/users/dto/create-user.dto.ts
import {
  IsEmail,
  IsNotEmpty,
  MinLength,
  IsOptional,
  IsString,
  IsBoolean,
  IsEnum,
} from 'class-validator';
import { DriverApprovalStatus } from '@prisma/client';

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  // TODO: Add more complex password policy validation
  password!: string;

  @IsNotEmpty()
  @IsString()
  fullName!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  roleId?: string; // Change to roleId as string

  @IsOptional()
  @IsString()
  customerType?: string;

  @IsOptional()
  @IsString()
  taxCode?: string;

  @IsOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  licenseNumber?: string;

  @IsOptional()
  @IsString()
  licenseClass?: string;

  @IsOptional()
  licenseExpiry?: Date;

  @IsOptional()
  experience?: number;

  @IsOptional()
  @IsString({ each: true })
  languages?: string[];

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  rating?: number;

  @IsOptional()
  @IsEnum(DriverApprovalStatus)
  driverStatus?: DriverApprovalStatus;

  @IsOptional()
  @IsString()
  supabaseId?: string;
}
