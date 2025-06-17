// src/users/dto/update-user.dto.ts
import { PartialType } from '@nestjs/mapped-types'; // Hoặc @nestjs/swagger nếu dùng swagger-specific DTOs
import { CreateUserDto } from './create-user.dto';
import {
  IsOptional,
  IsString,
  IsBoolean,
  IsEnum,
  IsEmail,
  MinLength,
} from 'class-validator';
import { InputType, Field } from '@nestjs/graphql';
import { DriverApprovalStatus } from '@prisma/client';

// Kế thừa từ CreateUserDto nhưng tất cả các trường là optional
// Loại bỏ các trường không cho phép update qua endpoint này (email, password, role)
@InputType()
export class UpdateUserDto {
  @IsOptional()
  @IsEmail()
  @Field({ nullable: true })
  email?: string;

  @IsOptional()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @IsString()
  @Field({ nullable: true })
  password?: string;

  @IsOptional()
  @IsString()
  @Field({ nullable: true })
  fullName?: string;

  @IsOptional()
  @IsString()
  @Field({ nullable: true })
  phone?: string;

  @IsOptional()
  @IsString()
  @Field({ nullable: true })
  customerType?: string;

  @IsOptional()
  @IsString()
  @Field({ nullable: true })
  taxCode?: string;

  @IsOptional()
  @IsString()
  @Field({ nullable: true })
  companyName?: string;

  @IsOptional()
  @IsString()
  @Field({ nullable: true })
  avatarUrl?: string;

  @IsOptional()
  @IsBoolean()
  @Field({ nullable: true })
  isActive?: boolean; // Cho phép ADMIN/STAFF vô hiệu hóa user

  @IsOptional()
  @IsString()
  @Field({ nullable: true })
  language?: string;

  @IsOptional()
  @IsString()
  @Field({ nullable: true })
  licenseNumber?: string;

  @IsOptional()
  @IsString()
  @Field({ nullable: true })
  licenseClass?: string;

  @IsOptional()
  @Field({ nullable: true })
  licenseExpiry?: Date;

  @IsOptional()
  @Field({ nullable: true })
  experience?: number;

  @IsOptional()
  @IsString({ each: true })
  @Field(() => [String], { nullable: true })
  languages?: string[];

  @IsOptional()
  @IsString()
  @Field({ nullable: true })
  bio?: string;

  @IsOptional()
  @Field({ nullable: true })
  rating?: number;

  @IsOptional()
  @IsEnum(DriverApprovalStatus) // Use IsEnum for DriverApprovalStatus
  @Field(() => DriverApprovalStatus, { nullable: true })
  driverStatus?: DriverApprovalStatus;

  @IsOptional()
  @IsString()
  @Field({ nullable: true })
  supabaseId?: string;

  @IsOptional()
  @IsString()
  @Field({ nullable: true })
  roleId?: string;
}
