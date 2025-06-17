import { InputType, Field, Float } from '@nestjs/graphql';
import { IsString, IsNumber, IsOptional, IsDateString } from 'class-validator';

@InputType()
export class InsuranceDetailsInput {
  @Field()
  @IsString()
  insurer!: string;

  @Field()
  @IsString()
  planCode!: string;

  @Field()
  @IsString()
  coverage!: string;

  @Field(() => Float)
  @IsNumber()
  premium!: number;

  @Field()
  @IsString()
  policyNumber!: string;

  @Field()
  @IsDateString()
  effectiveDate!: string; // Use string for GraphQL input, converted to Date in service

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  deductible?: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  beneficiary?: string;
}
