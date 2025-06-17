import { ObjectType, Field } from '@nestjs/graphql';
import { BannerEntity } from './banner.entity';
import { PaginationMetadata } from '../../common/dto/pagination-metadata.dto';

@ObjectType()
export class BannerPaginationResponse {
  @Field(() => [BannerEntity])
  data!: BannerEntity[];

  @Field(() => PaginationMetadata)
  metadata!: PaginationMetadata;
}
