import {
  IsOptional,
  IsString,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsArray,
} from 'class-validator';
import { ServiceType } from '@prisma/client';
import { BaseFilterDto } from '../../common/dto/base-filter.dto';
import { InputType, Field } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';

@InputType()
export class ServiceFilterDto extends BaseFilterDto {
  @ApiProperty({
    description: 'Service name filter',
    required: false,
  })
  @Field({ nullable: true })
  @IsOptional()
  @IsString({ message: 'Name must be a string' })
  name?: string;

  @ApiProperty({
    description: 'Service type filter',
    enum: ServiceType,
    required: false,
  })
  @Field(() => ServiceType, { nullable: true })
  @IsOptional()
  @IsEnum(ServiceType, { message: 'Type must be a valid ServiceType' })
  type?: ServiceType;

  @ApiProperty({
    description: 'Minimum price filter',
    required: false,
  })
  @Field({ nullable: true })
  @IsOptional()
  @IsNumber({}, { message: 'minPrice must be a number' })
  minPrice?: number;

  @ApiProperty({
    description: 'Maximum price filter',
    required: false,
  })
  @Field({ nullable: true })
  @IsOptional()
  @IsNumber({}, { message: 'maxPrice must be a number' })
  maxPrice?: number;

  @ApiProperty({
    description: 'Include deleted services',
    required: false,
  })
  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean({ message: 'isDeleted must be a boolean' })
  isDeleted?: boolean;

  @ApiProperty({
    description: 'Service tags filter',
    type: [String],
    required: false,
  })
  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray({ message: 'tags must be an array' })
  @IsString({ each: true, message: 'Each tag must be a string' })
  tags?: string[];
}
