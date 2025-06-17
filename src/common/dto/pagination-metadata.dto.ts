import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class PaginationMetadata {
  @Field(() => Int)
  total!: number;

  @Field(() => Int)
  page!: number;

  @Field(() => Int)
  limit!: number;
}
