import { ObjectType, Field } from '@nestjs/graphql';
import { BookingEntity } from './booking.entity';
import { PaginationMetadata } from '../../common/dto/pagination-metadata.dto';

@ObjectType()
export class BookingPaginationResponse {
  @Field(() => [BookingEntity])
  data!: BookingEntity[];

  @Field(() => PaginationMetadata)
  metadata!: PaginationMetadata;
}
