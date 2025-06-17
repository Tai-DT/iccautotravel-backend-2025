import { InputType, Field, Float } from '@nestjs/graphql';
import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

@InputType()
export class ComboDetailsInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  title!: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  items?: string; // JSON string containing details of included services

  @Field(() => Float)
  @IsNumber()
  comboPrice!: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  discountPercent?: number;

  @Field()
  @IsString()
  @IsNotEmpty()
  validity!: string; // e.g., date range or number of days
}
