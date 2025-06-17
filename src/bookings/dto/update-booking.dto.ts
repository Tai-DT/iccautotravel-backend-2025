import { InputType, Field, PartialType } from '@nestjs/graphql';
import { IsString, IsOptional } from 'class-validator';
import { CreateBookingDto } from './create-booking.dto';

@InputType()
export class UpdateBookingDto extends PartialType(CreateBookingDto) {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  status?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  vehicleId?: string; // For overlap check

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  startDate?: string; // ISO string for overlap check

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  endDate?: string; // ISO string for overlap check
}
