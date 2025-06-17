import { InputType, Field } from '@nestjs/graphql';
import { ServiceType } from '@prisma/client';
import {
  IsEnum,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
} from 'class-validator';
import { GraphQLJSON } from 'graphql-scalars';

@InputType()
export class CreateServiceInput {
  @Field(() => ServiceType)
  @IsEnum(ServiceType, { message: 'Loại dịch vụ không hợp lệ' })
  @IsNotEmpty({ message: 'Loại dịch vụ không được để trống' })
  type!: ServiceType;

  @Field()
  @IsString({ message: 'Tên dịch vụ phải là chuỗi' })
  @IsNotEmpty({ message: 'Tên dịch vụ không được để trống' })
  name!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString({ message: 'Mô tả dịch vụ phải là chuỗi' })
  description?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber({}, { message: 'Giá phải là số' })
  price?: number;

  @Field({ nullable: true, defaultValue: 'VND' })
  @IsOptional()
  @IsString({ message: 'Đơn vị tiền tệ phải là chuỗi' })
  currency?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber({}, { message: 'Thời gian phải là số' })
  duration?: number;

  @Field({ nullable: true, defaultValue: 'HOUR' })
  @IsOptional()
  @IsString({ message: 'Đơn vị thời gian phải là chuỗi' })
  durationUnit?: string;

  @Field({ nullable: true, defaultValue: 'ACTIVE' })
  @IsOptional()
  @IsString({ message: 'Trạng thái phải là chuỗi' })
  status?: string;

  @Field(() => [String], { nullable: true, defaultValue: [] })
  @IsOptional()
  @IsArray({ message: 'Điểm nổi bật phải là mảng' })
  @IsString({ each: true, message: 'Mỗi điểm nổi bật phải là chuỗi' })
  highlights?: string[];

  @Field(() => [String], { nullable: true, defaultValue: [] })
  @IsOptional()
  @IsArray({ message: 'Thẻ phải là mảng' })
  @IsString({ each: true, message: 'Mỗi thẻ phải là chuỗi' })
  tags?: string[];

  @Field({ nullable: true })
  @IsOptional()
  @IsString({ message: 'URL hình ảnh phải là chuỗi' })
  imageUrl?: string;

  @Field(() => GraphQLJSON, { nullable: true })
  @IsOptional()
  metadata?: Record<string, any> | null;
}
