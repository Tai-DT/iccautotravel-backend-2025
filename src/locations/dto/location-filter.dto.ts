import { InputType, Field } from '@nestjs/graphql';
import { IsOptional, IsString, IsBoolean, IsEnum } from 'class-validator';
import { LocationType } from '../entities/location.entity';

@InputType()
export class LocationFilterDto {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  search?: string;

  @Field(() => LocationType, { nullable: true })
  @IsOptional()
  @IsEnum(LocationType)
  type?: LocationType;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  country?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  city?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isPopular?: boolean;
}
