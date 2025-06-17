import { InputType, Field, PartialType, OmitType } from '@nestjs/graphql';
import { CreateServiceInput } from './create-service.input';
import {
  IsBoolean,
  IsOptional,
  IsString,
  IsNumber,
  IsArray,
} from 'class-validator';
import { GraphQLJSON } from 'graphql-scalars';

@InputType()
export class UpdateServiceInput extends PartialType(
  OmitType(CreateServiceInput, [] as const),
) {
  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean({ message: 'isDeleted phải là giá trị boolean' })
  isDeleted?: boolean;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean({ message: 'isActive phải là giá trị boolean' })
  isActive?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsString({ message: 'Trạng thái phải là chuỗi' })
  status?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber({}, { message: 'Giá phải là số' })
  price?: number;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray({ message: 'Điểm nổi bật phải là mảng' })
  @IsString({ each: true, message: 'Mỗi điểm nổi bật phải là chuỗi' })
  highlights?: string[];

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray({ message: 'Thẻ phải là mảng' })
  @IsString({ each: true, message: 'Mỗi thẻ phải là chuỗi' })
  tags?: string[];

  @Field(() => GraphQLJSON, { nullable: true })
  @IsOptional()
  metadata?: Record<string, any> | null;
}
