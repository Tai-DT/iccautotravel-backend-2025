import { InputType, Field } from '@nestjs/graphql';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsDateString,
  IsInt,
  IsEnum,
} from 'class-validator';
import { BannerPosition } from '../enums/banner-position.enum';
import { BannerType } from '../enums/banner-type.enum';

@InputType()
export class CreateBannerInput {
  @Field()
  @IsString()
  title!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  subtitle?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field()
  @IsString()
  imageUrl!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  linkUrl?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  buttonText?: string;

  @Field(() => BannerPosition, {
    nullable: true,
    defaultValue: BannerPosition.HOMEPAGE,
  })
  @IsOptional()
  @IsEnum(BannerPosition)
  position?: BannerPosition;

  @Field(() => BannerType, { nullable: true, defaultValue: BannerType.HERO })
  @IsOptional()
  @IsEnum(BannerType)
  type?: BannerType;

  @Field({ nullable: true, defaultValue: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @Field({ nullable: true, defaultValue: 0 })
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @Field({ nullable: true, defaultValue: 'vi' })
  @IsOptional()
  @IsString()
  lang?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  seoTitle?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  seoDescription?: string;
}
