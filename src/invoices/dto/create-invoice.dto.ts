import { IsNumber, IsOptional, IsString } from 'class-validator';
import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class CreateInvoiceDto {
  @Field()
  @IsString()
  bookingId!: string;

  @Field()
  @IsString()
  type!: string; // VAT | STANDARD

  @Field(() => Number)
  @IsNumber()
  amount!: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  pdfUrl?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  status?: string; // DRAFT | ISSUED | PAID | CANCELLED
}
