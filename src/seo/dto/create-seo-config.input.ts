import { InputType, Field } from '@nestjs/graphql';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsUrl,
  IsArray,
} from 'class-validator';

@InputType()
export class CreateSEOConfigInput {
  @Field()
  @IsString()
  page!: string;

  @Field()
  @IsString()
  title!: string;

  @Field()
  @IsString()
  description!: string;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keywords?: string[];

  @Field({ nullable: true })
  @IsOptional()
  @IsUrl()
  canonicalUrl?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  ogTitle?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  ogDescription?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUrl()
  ogImage?: string;

  @Field({ nullable: true, defaultValue: 'website' })
  @IsOptional()
  @IsString()
  ogType?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUrl()
  ogUrl?: string;

  @Field({ nullable: true, defaultValue: 'summary' })
  @IsOptional()
  @IsString()
  twitterCard?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  twitterTitle?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  twitterDescription?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUrl()
  twitterImage?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  twitterSite?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  twitterCreator?: string;

  @Field({ nullable: true, defaultValue: 'index,follow' })
  @IsOptional()
  @IsString()
  robots?: string;

  @Field({ nullable: true, defaultValue: 'vi' })
  @IsOptional()
  @IsString()
  lang?: string;

  @Field({ nullable: true, defaultValue: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
