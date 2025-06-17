import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class PaginationOptionsDto {
  @ApiProperty({ default: 1, required: false })
  @Field(() => Int, { defaultValue: 1, nullable: true })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiProperty({ default: 10, required: false })
  @Field(() => Int, { defaultValue: 10, nullable: true })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 10;
}

@InputType()
export class PaginationDto {
  @ApiProperty({ default: 1, required: false })
  @Field(() => Int, { defaultValue: 1, nullable: true })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiProperty({ default: 10, required: false })
  @Field(() => Int, { defaultValue: 10, nullable: true })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 10;
}
