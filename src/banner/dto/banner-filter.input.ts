import { InputType, Field } from '@nestjs/graphql';
import { IsOptional, IsEnum, IsBoolean, IsString } from 'class-validator';
import { BannerPosition } from '../enums/banner-position.enum';
import { BannerType } from '../enums/banner-type.enum';

@InputType()
export class BannerFilterInput {
  @Field(() => BannerPosition, { nullable: true })
  @IsOptional()
  @IsEnum(BannerPosition)
  position?: BannerPosition;

  @Field(() => BannerType, { nullable: true })
  @IsOptional()
  @IsEnum(BannerType)
  type?: BannerType;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  lang?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  search?: string;
}
