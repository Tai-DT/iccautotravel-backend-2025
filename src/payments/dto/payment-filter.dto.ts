import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsString, IsEnum, IsDate, IsUUID } from 'class-validator';
import { PaymentStatus } from '@prisma/client';

import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class PaymentFilterDto {
  @Field(() => PaymentStatus, { nullable: true })
  @ApiProperty({ required: false, enum: PaymentStatus })
  @IsEnum(PaymentStatus)
  @IsOptional()
  status?: PaymentStatus;

  @Field({ nullable: true })
  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  bookingId?: string;

  @Field({ nullable: true })
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  provider?: string;

  @Field({ nullable: true })
  @ApiProperty({ required: false })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  startDate?: Date;

  @Field({ nullable: true })
  @ApiProperty({ required: false })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  endDate?: Date;

  @IsOptional()
  @IsString()
  dateFrom?: string;

  @IsOptional()
  @IsString()
  dateTo?: string;
}
