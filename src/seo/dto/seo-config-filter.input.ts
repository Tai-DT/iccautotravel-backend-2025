import { InputType, Field } from '@nestjs/graphql';
import { IsOptional, IsBoolean, IsString } from 'class-validator';

@InputType()
export class SEOConfigFilterInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  page?: string;

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
