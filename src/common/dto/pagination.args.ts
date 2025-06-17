import { ArgsType, Field, Int } from '@nestjs/graphql';
import { IsOptional, Min, Max } from 'class-validator';

@ArgsType()
export class PaginationArgs {
  @Field(() => Int, { nullable: true, defaultValue: 0 })
  @IsOptional()
  @Min(0, { message: 'Skip không được nhỏ hơn 0' })
  skip?: number;

  @Field(() => Int, { nullable: true, defaultValue: 10 })
  @IsOptional()
  @Min(1, { message: 'Take không được nhỏ hơn 1' })
  @Max(50, { message: 'Take không được lớn hơn 50' })
  take?: number;
}
