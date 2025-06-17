import { Field, ObjectType, Int, Float } from '@nestjs/graphql';

@ObjectType()
export class FastTrackDetails {
  @Field()
  flightNumber!: string;

  @Field()
  airport!: string;

  @Field()
  serviceLevel!: string;

  @Field(() => Int)
  paxCount!: number;

  @Field(() => Float)
  price!: number;
}
