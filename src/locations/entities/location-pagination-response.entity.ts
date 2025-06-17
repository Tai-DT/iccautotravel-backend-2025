import { ObjectType, Field } from '@nestjs/graphql';
import { LocationEntity } from './location.entity';
import { PaginationMetadata } from '../../common/dto/pagination-metadata.dto';

@ObjectType()
export class LocationPaginationResponse {
  @Field(() => [LocationEntity])
  data!: LocationEntity[];

  @Field(() => PaginationMetadata)
  metadata!: PaginationMetadata;
}
