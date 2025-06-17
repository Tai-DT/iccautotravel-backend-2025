import { Field, InputType, Int } from '@nestjs/graphql';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsInt,
  IsArray,
  IsBoolean,
  IsDate,
} from 'class-validator';
import { ApprovalStatus } from '../entities/driver.entity';

@InputType()
export class ApproveDriverDto {
  @Field(() => ApprovalStatus)
  @IsEnum(ApprovalStatus)
  status!: ApprovalStatus;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  notes?: string;
}

@InputType()
export class CreateDriverDto {
  @Field()
  @IsString()
  userId!: string;

  @Field()
  @IsString()
  licenseNumber!: string;

  @Field()
  @IsString()
  licenseClass!: string;

  @Field()
  @IsDate()
  licenseExpiry!: Date;

  @Field(() => Int)
  @IsInt()
  experience!: number;

  @Field(() => [String], { nullable: true })
  @IsArray()
  @IsOptional()
  languages?: string[];

  @Field({ nullable: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

@InputType()
export class UpdateDriverDto {
  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  licenseNumber?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  licenseClass?: string;

  @Field({ nullable: true })
  @IsDate()
  @IsOptional()
  licenseExpiry?: Date;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @IsOptional()
  experience?: number;

  @Field(() => [String], { nullable: true })
  @IsArray()
  @IsOptional()
  languages?: string[];

  @Field({ nullable: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

@InputType()
export class DriverFilterDto {
  @Field(() => Int, { nullable: true })
  @IsInt()
  @IsOptional()
  page?: number;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @IsOptional()
  limit?: number;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  search?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  isActive?: string;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @IsOptional()
  minRating?: number;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  specialties?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  languages?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  approvalStatus?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  sortBy?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  sortOrder?: string;

  @Field({ nullable: true })
  @IsBoolean()
  @IsOptional()
  speaksEnglish?: boolean;

  @Field({ nullable: true })
  @IsBoolean()
  @IsOptional()
  speaksVietnamese?: boolean;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @IsOptional()
  minExperience?: number;

  @Field(() => ApprovalStatus, { nullable: true })
  @IsEnum(ApprovalStatus)
  @IsOptional()
  status?: ApprovalStatus;
}
