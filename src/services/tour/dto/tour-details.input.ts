import { InputType, Field, Float, Int } from '@nestjs/graphql';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  IsDateString,
} from 'class-validator';

@InputType()
export class TourDetailsInput {
  @Field()
  @IsString()
  tourCode!: string;

  @Field()
  @IsString()
  title!: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  itinerary?: string; // JSON string containing itinerary details

  @Field(() => [String])
  @IsArray()
  departureDates!: string[]; // Date strings for GraphQL input

  @Field(() => Float)
  @IsNumber()
  adultPrice!: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  childPrice?: number;

  @Field(() => Int)
  @IsNumber()
  seatsLeft!: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  seatsAvailable?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  minPax?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  maxPax?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  durationInDays?: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  description?: string;
}
