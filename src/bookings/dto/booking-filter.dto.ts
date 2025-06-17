import { IsString, IsOptional } from 'class-validator';
import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class BookingFilterDto {
  @IsOptional()
  @IsString()
  @Field({ nullable: true })
  userId?: string;

  @IsOptional()
  @IsString()
  @Field({ nullable: true })
  status?: string;

  @IsOptional()
  @IsString()
  @Field({ nullable: true })
  paymentStatus?: string;

  @IsOptional()
  @IsString()
  @Field({ nullable: true })
  dateFrom?: string;

  @IsOptional()
  @IsString()
  @Field({ nullable: true })
  dateTo?: string;

  @IsOptional()
  @IsString()
  @Field({ nullable: true })
  startDate?: string;

  @IsOptional()
  @IsString()
  @Field({ nullable: true })
  endDate?: string;
}
