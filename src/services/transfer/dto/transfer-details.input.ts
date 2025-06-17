import { InputType, Field, Float, Int } from '@nestjs/graphql';
import { IsString, IsNumber, IsOptional } from 'class-validator';

@InputType()
export class TransferDetailsInput {
  @Field()
  @IsString()
  vehicleType!: string;

  @Field()
  @IsString()
  route!: string;

  @Field(() => Float)
  @IsNumber()
  distanceKm!: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  waitTime?: number; // in minutes

  @Field(() => Float)
  @IsNumber()
  price!: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  fromLocation?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  toLocation?: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  basePrice?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  maxPassengers?: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  description?: string;
}
