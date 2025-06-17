import { InputType, Field } from '@nestjs/graphql';
import { ServiceType } from '@prisma/client';
import { IsOptional, IsEnum, IsString, IsBoolean } from 'class-validator';
import { PaginationArgs } from '../../common/dto/pagination.args';

@InputType()
export class ServiceFilterInput extends PaginationArgs {
  @Field(() => ServiceType, { nullable: true })
  @IsOptional()
  @IsEnum(ServiceType, { message: 'Loại dịch vụ không hợp lệ' })
  type?: ServiceType;

  @Field({ nullable: true })
  @IsOptional()
  @IsString({ message: 'Tên dịch vụ phải là chuỗi' })
  name?: string;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean({ message: 'isActive phải là giá trị boolean' })
  isActive?: boolean;

  @Field(() => Boolean, { nullable: true, defaultValue: false })
  @IsOptional()
  @IsBoolean({ message: 'isDeleted phải là giá trị boolean' })
  isDeleted?: boolean;
}
