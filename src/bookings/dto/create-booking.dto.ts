import { Field, InputType } from '@nestjs/graphql';
import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { BookingOptionsDto } from './booking-options.dto';

@InputType()
export class CreateBookingDto {
  @Field()
  @IsString()
  userId!: string;

  @Field(() => [String])
  @IsArray()
  serviceIds!: string[];

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  vehicleId?: string;

  @Field(() => BookingOptionsDto, { nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => BookingOptionsDto)
  options?: BookingOptionsDto;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;

  @Field()
  @IsString()
  startDate!: string; // ISO string required for overlap check

  @Field()
  @IsString()
  endDate!: string; // ISO string required for overlap check
}
