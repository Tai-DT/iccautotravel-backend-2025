import { InputType, Field } from '@nestjs/graphql';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  IsBoolean,
} from 'class-validator';

@InputType()
export class CreateBusDto {
  @Field()
  @IsString()
  name!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field()
  @IsString()
  busCompany!: string;

  @Field()
  @IsString()
  busType!: string; // STANDARD, VIP, SLEEPER, LIMOUSINE

  @Field()
  @IsString()
  route!: string;

  @Field()
  @IsString()
  departureStation!: string;

  @Field()
  @IsString()
  arrivalStation!: string;

  @Field()
  @IsString()
  departureCity!: string;

  @Field()
  @IsString()
  arrivalCity!: string;

  @Field()
  @IsString()
  departureTime!: string;

  @Field()
  @IsString()
  arrivalTime!: string;

  @Field()
  @IsString()
  duration!: string;

  @Field()
  @IsNumber()
  distance!: number;

  @Field()
  @IsNumber()
  price!: number;

  @Field()
  @IsNumber()
  totalSeats!: number;

  @Field()
  @IsString()
  seatType!: string; // SITTING, SLEEPER, DOUBLE_DECK

  @Field(() => [String])
  @IsArray()
  features!: string[];

  @Field(() => [String])
  @IsArray()
  pickupPoints!: string[];

  @Field(() => [String])
  @IsArray()
  dropoffPoints!: string[];

  @Field(() => [String])
  @IsArray()
  operatingDays!: string[];

  @Field(() => [String])
  @IsArray()
  amenities!: string[];

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  driverName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  driverPhone?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  vehicleLicensePlate?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  vehicleModel?: string;

  @Field({ defaultValue: true })
  @IsBoolean()
  isActive?: boolean;
}
