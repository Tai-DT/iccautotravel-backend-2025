import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class PaymentVerificationDto {
  @ApiProperty({ description: 'Transaction ID from payment provider' })
  @IsNotEmpty()
  @IsString()
  transactionId!: string;

  @ApiProperty({ description: 'Payment status (PAID, FAILED, PENDING)' })
  @IsNotEmpty()
  @IsString()
  status!: string;

  @ApiProperty({ description: 'Payment method used', required: false })
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiProperty({ description: 'When payment was completed', required: false })
  @IsOptional()
  @IsString()
  paidAt?: string;

  @ApiProperty({ description: 'Additional verification data', required: false })
  @IsOptional()
  data?: any;
}
