import { Field, InputType, Int } from '@nestjs/graphql';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

// Define our own ReviewStatus enum since it doesn't exist in Prisma client
export enum ReviewStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

@InputType()
export class UpdateDriverReviewInput {
  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  comment?: string;

  @Field(() => ReviewStatus, { nullable: true })
  @IsOptional()
  @IsEnum(ReviewStatus)
  status?: ReviewStatus;
}
