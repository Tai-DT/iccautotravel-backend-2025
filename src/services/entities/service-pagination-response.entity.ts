import { ObjectType, Field } from '@nestjs/graphql';
import { ServiceEntity } from './service.entity';
import { PaginationMetadata } from '../../common/dto/pagination-metadata.dto';

@ObjectType()
export class ServicePaginationResponse {
  @Field(() => [ServiceEntity])
  data!: ServiceEntity[];

  @Field(() => PaginationMetadata)
  metadata!: PaginationMetadata;
}
