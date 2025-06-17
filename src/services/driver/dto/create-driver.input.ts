import { InputType, Field, Float } from '@nestjs/graphql';
import {
  IsNotEmpty,
  IsString,
  IsEmail,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsDate,
} from 'class-validator';
import { Type } from 'class-transformer';

@InputType()
export class CreateDriverInput {
  @Field()
  @IsNotEmpty()
  @IsString()
  fullName!: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  phone!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsEmail()
  email?: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  licenseNumber!: string;

  @Field(() => Date)
  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  licenseExpiry!: Date;

  @Field(() => Float, { defaultValue: 0 })
  @IsOptional()
  @IsNumber()
  experienceYears?: number;

  @Field(() => Boolean, { defaultValue: false })
  @IsOptional()
  @IsBoolean()
  speaksEnglish?: boolean;

  @Field(() => Boolean, { defaultValue: true })
  @IsOptional()
  @IsBoolean()
  speaksVietnamese?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;
}
