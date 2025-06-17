import { ObjectType } from '@nestjs/graphql';

@ObjectType({ isAbstract: true })
export abstract class PaginationResponse {}
