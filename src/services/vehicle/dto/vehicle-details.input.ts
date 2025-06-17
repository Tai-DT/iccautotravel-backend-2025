import { InputType, Field, Float, Int } from '@nestjs/graphql';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsArray,
} from 'class-validator';

@InputType()
export class VehicleDetailsInput {
  @Field()
  @IsString()
  type!: string; // car | bus

  @Field()
  @IsString()
  brand!: string;

  @Field()
  @IsString()
  model!: string;

  @Field(() => Int)
  @IsNumber()
  seats!: number;

  @Field()
  @IsString()
  licensePlate!: string;

  @Field(() => Float)
  @IsNumber()
  pricePerDay!: number;

  @Field()
  @IsString()
  fuelType!: string;

  @Field(() => [String])
  @IsArray()
  extras!: string[];

  @Field(() => String, { nullable: true })
  @IsOptional()
  pickupLocation?: string;

  @Field(() => Number, { nullable: true })
  @IsOptional()
  pickupLatitude?: number;

  @Field(() => Number, { nullable: true })
  @IsOptional()
  pickupLongitude?: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  dropoffLocation?: string;

  @Field(() => Number, { nullable: true })
  @IsOptional()
  dropoffLatitude?: number;

  @Field(() => Number, { nullable: true })
  @IsOptional()
  dropoffLongitude?: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  description?: string;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  driverIncluded?: boolean;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  englishSpeakingDriver?: boolean;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  vietnameseSpeakingDriver?: boolean;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  driverIds?: string[];
}
