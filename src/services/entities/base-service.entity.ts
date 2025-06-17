import { Field, ID, ObjectType } from '@nestjs/graphql';
import { ServiceType } from '@prisma/client'; // Import ServiceType from Prisma
import { GraphQLJSON } from 'graphql-scalars';

@ObjectType()
export class BaseServiceEntity {
  @Field(() => ID)
  id!: string;

  @Field(() => ServiceType)
  type!: ServiceType;

  @Field()
  name!: string;

  // Metadata structure will vary per service type
  @Field(() => GraphQLJSON, { nullable: true }) // Use GraphQLJSON scalar for metadata
  metadata?: Record<string, any> | null;

  @Field()
  isDeleted!: boolean;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}
