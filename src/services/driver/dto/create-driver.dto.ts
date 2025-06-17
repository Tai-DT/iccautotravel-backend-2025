import { Field, InputType } from '@nestjs/graphql';
import {
  IsArray,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

@InputType()
export class CreateDriverDto {
  @ApiProperty({ description: 'Full name of the driver' })
  @Field()
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @ApiProperty({ description: 'Phone number of the driver' })
  @Field()
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @ApiProperty({ description: 'Email of the driver', required: false })
  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiProperty({ description: 'User ID of the driver' })
  @Field()
  @IsUUID()
  @IsNotEmpty()
  userId: string = ''; // Khởi tạo giá trị mặc định

  @ApiProperty({ description: 'License number of the driver' })
  @Field()
  @IsString()
  @IsNotEmpty()
  licenseNumber: string = ''; // Khởi tạo giá trị mặc định

  @ApiProperty({ description: 'License class of the driver' })
  @Field()
  @IsString()
  @IsNotEmpty()
  licenseClass: string = ''; // Khởi tạo giá trị mặc định

  @ApiProperty({ description: 'License expiry date' })
  @Field()
  @IsDate()
  @Type(() => Date)
  licenseExpiry: Date = new Date(); // Khởi tạo giá trị mặc định

  @ApiProperty({ description: 'Years of experience' })
  @Field()
  @IsNumber()
  @Min(0)
  experience: number = 0; // Khởi tạo giá trị mặc định

  @ApiProperty({ description: 'Bio or about information', required: false })
  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  bio?: string;

  @ApiProperty({
    description: 'Languages spoken by driver',
    example: ['Vietnamese', 'English'],
  })
  @Field(() => [String])
  @IsArray()
  @IsString({ each: true })
  languages: string[] = []; // Khởi tạo giá trị mặc định

  @ApiProperty({
    description: 'Status of driver approval',
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING',
    required: false,
  })
  @Field({ nullable: true })
  @IsOptional()
  @IsEnum(['PENDING', 'APPROVED', 'REJECTED'], {
    message: 'Status must be one of: PENDING, APPROVED, REJECTED',
  })
  status?: 'PENDING' | 'APPROVED' | 'REJECTED' = 'PENDING';
}
