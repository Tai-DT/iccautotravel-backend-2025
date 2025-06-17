import { ObjectType, Field } from '@nestjs/graphql';
import { UserEntity } from './user.entity';
import { PaginationMetadata } from '../../common/dto/pagination-metadata.dto';

@ObjectType()
export class UserPaginationResponse {
  @Field(() => [UserEntity])
  data!: UserEntity[];

  @Field(() => PaginationMetadata)
  metadata!: PaginationMetadata;
}
