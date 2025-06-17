import { InputType, Field } from '@nestjs/graphql';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsEnum,
  Min,
  Max,
} from 'class-validator';
import { LocationType } from '../entities/location.entity';

@InputType()
export class CreateLocationInput {
  @Field()
  @IsString({ message: 'Tên địa điểm phải là chuỗi' })
  @IsNotEmpty({ message: 'Tên địa điểm không được để trống' })
  name!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString({ message: 'Địa chỉ phải là chuỗi' })
  address?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString({ message: 'Quận/huyện phải là chuỗi' })
  district?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString({ message: 'Thành phố phải là chuỗi' })
  city?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString({ message: 'Quốc gia phải là chuỗi' })
  country?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString({ message: 'Mã bưu chính phải là chuỗi' })
  zipCode?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber({}, { message: 'Vĩ độ phải là số' })
  @Min(-90, { message: 'Vĩ độ phải lớn hơn hoặc bằng -90' })
  @Max(90, { message: 'Vĩ độ phải nhỏ hơn hoặc bằng 90' })
  latitude?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber({}, { message: 'Kinh độ phải là số' })
  @Min(-180, { message: 'Kinh độ phải lớn hơn hoặc bằng -180' })
  @Max(180, { message: 'Kinh độ phải nhỏ hơn hoặc bằng 180' })
  longitude?: number;

  @Field(() => LocationType)
  @IsEnum(LocationType, { message: 'Loại địa điểm không hợp lệ' })
  @IsNotEmpty({ message: 'Loại địa điểm không được để trống' })
  type!: LocationType;

  @Field({ nullable: true })
  @IsOptional()
  @IsString({ message: 'Mô tả phải là chuỗi' })
  description?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString({ message: 'URL hình ảnh phải là chuỗi' })
  imageUrl?: string;

  @Field(() => Boolean, { nullable: true, defaultValue: true })
  @IsOptional()
  @IsBoolean({ message: 'isActive phải là giá trị boolean' })
  isActive?: boolean;

  @Field(() => Boolean, { nullable: true, defaultValue: false })
  @IsOptional()
  @IsBoolean({ message: 'isPopular phải là giá trị boolean' })
  isPopular?: boolean;
}
