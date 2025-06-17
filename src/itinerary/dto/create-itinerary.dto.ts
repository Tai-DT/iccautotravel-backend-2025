import {
  IsString,
  IsOptional,
  IsArray,
  IsNumber,
  IsDate,
} from 'class-validator';
import { Type } from 'class-transformer';
import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class CreateItineraryDto {
  @Field()
  @IsString()
  origin!: string;

  @Field()
  @IsString()
  destination!: string;

  @Field(() => Date, { nullable: true })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @Field(() => Date, { nullable: true })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferences?: string[];

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  budget?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  travelType?: string;
}
