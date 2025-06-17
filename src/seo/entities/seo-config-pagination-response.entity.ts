import { ObjectType, Field } from '@nestjs/graphql';
import { SEOConfigEntity } from './seo-config.entity';
import { PaginationMetadata } from '../../common/dto/pagination-metadata.dto';

@ObjectType()
export class SEOConfigPaginationResponse {
  @Field(() => [SEOConfigEntity])
  data!: SEOConfigEntity[];

  @Field(() => PaginationMetadata)
  metadata!: PaginationMetadata;
}
