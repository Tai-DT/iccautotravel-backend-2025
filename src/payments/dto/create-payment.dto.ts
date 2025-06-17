import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsPositive,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Field, InputType } from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-scalars';

@InputType()
export class CreatePaymentDto {
  @ApiProperty({ description: 'Booking ID', required: true })
  @Field()
  @IsNotEmpty()
  @IsString()
  bookingId!: string;

  @ApiProperty({ description: 'Payment amount', required: true })
  @Field(() => Number)
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  amount!: number;

  @ApiProperty({
    description: 'Currency code',
    default: 'VND',
    required: false,
  })
  @Field({ nullable: true, defaultValue: 'VND' })
  @IsOptional()
  currency?: string;

  @ApiProperty({
    description: 'Payment provider (VNPAY, MOMO, STRIPE)',
    required: true,
  })
  @Field()
  @IsNotEmpty()
  @IsString()
  provider!: string;

  @ApiProperty({ description: 'URL to redirect after payment', required: true })
  @Field()
  @IsNotEmpty()
  @IsString()
  returnUrl!: string;

  @ApiProperty({
    description: 'URL to redirect if payment is cancelled',
    required: false,
  })
  @Field({ nullable: true })
  @IsOptional()
  cancelUrl?: string;

  @ApiProperty({ description: 'Payment description', required: false })
  @Field({ nullable: true })
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Customer name', required: false })
  @Field({ nullable: true })
  @IsOptional()
  customerName?: string;

  @ApiProperty({ description: 'Customer email', required: false })
  @Field({ nullable: true })
  @IsOptional()
  customerEmail?: string;

  @ApiProperty({ description: 'Customer phone', required: false })
  @Field({ nullable: true })
  @IsOptional()
  customerPhone?: string;

  @ApiProperty({ description: 'Additional metadata', required: false })
  @Field(() => GraphQLJSON, { nullable: true })
  @IsOptional()
  metadata?: Record<string, any>;
}
