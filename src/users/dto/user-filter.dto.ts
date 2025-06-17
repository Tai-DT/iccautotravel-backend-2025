// src/users/dto/user-filter.dto.ts
import { IsOptional, IsString, IsEnum, IsBoolean } from 'class-validator';
import { Role } from '@prisma/client'; // Import Role từ Prisma
import { PaginationArgs } from '../../common/dto/pagination.args'; // Import PaginationArgs
import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class UserFilterDto extends PaginationArgs {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  email?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  fullName?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  role?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  customerType?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
