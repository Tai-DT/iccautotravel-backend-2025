import { Field, InputType, Int } from '@nestjs/graphql';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

@InputType()
export class CreateDriverReviewInput {
  @Field()
  @ApiProperty({ description: 'Driver ID' })
  @IsUUID()
  @IsNotEmpty()
  driverId: string = ''; // Khởi tạo giá trị mặc định

  @Field({ nullable: true })
  @ApiProperty({ description: 'Booking ID', required: false })
  @IsUUID()
  @IsOptional()
  bookingId?: string;

  @Field()
  @ApiProperty({ description: 'User ID (reviewer)' })
  @IsUUID()
  @IsNotEmpty()
  userId: string = ''; // Khởi tạo giá trị mặc định

  @Field({ nullable: true })
  @ApiProperty({ description: 'Comment', required: false })
  @IsString()
  @IsOptional()
  comment?: string;

  @Field(() => Int)
  @ApiProperty({ description: 'Rating (1-5)', minimum: 1, maximum: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number = 5; // Khởi tạo giá trị mặc định

  @Field({ nullable: true })
  @ApiProperty({ description: 'Status', required: false })
  @IsString()
  @IsOptional()
  status?: string;
}
