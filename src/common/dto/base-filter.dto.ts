import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean, IsDateString } from 'class-validator';
import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class BaseFilterDto {
  @ApiProperty({
    description: 'Search term for text fields',
    required: false,
  })
  @Field({ nullable: true })
  @IsOptional()
  @IsString({ message: 'Search must be a string' })
  search?: string;

  @ApiProperty({
    description: 'Filter by active status',
    required: false,
  })
  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean({ message: 'isActive must be a boolean' })
  isActive?: boolean;

  @ApiProperty({
    description: 'Filter from date (ISO string)',
    required: false,
  })
  @Field({ nullable: true })
  @IsOptional()
  @IsDateString({}, { message: 'dateFrom must be a valid ISO date string' })
  dateFrom?: string;

  @ApiProperty({
    description: 'Filter to date (ISO string)',
    required: false,
  })
  @Field({ nullable: true })
  @IsOptional()
  @IsDateString({}, { message: 'dateTo must be a valid ISO date string' })
  dateTo?: string;
}
