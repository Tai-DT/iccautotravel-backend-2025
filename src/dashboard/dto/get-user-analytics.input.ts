import { InputType, Field, Int } from '@nestjs/graphql';
import { IsOptional, IsInt, IsString, IsDate, IsEnum } from 'class-validator';
import { UserStatus } from '../enums/user-status.enum'; // Assuming UserStatus enum exists or will be created

@InputType()
export class GetUserAnalyticsInput {
  @Field(() => Date, { nullable: true })
  @IsOptional()
  @IsDate()
  startDate?: Date;

  @Field(() => Date, { nullable: true })
  @IsOptional()
  @IsDate()
  endDate?: Date;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  roleId?: string;

  @Field(() => UserStatus, { nullable: true })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  limit?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  offset?: number;
}
