import { Field, ObjectType, Float, Int } from '@nestjs/graphql';

@ObjectType()
export class TourDetails {
  @Field()
  tourCode!: string;

  @Field()
  title!: string;

  @Field(() => String, { nullable: true }) // Represent JSON as String
  itinerary?: string; // JSON string containing itinerary details

  @Field(() => [Date])
  departureDates!: Date[];

  @Field(() => Float)
  adultPrice!: number;

  @Field(() => Float, { nullable: true })
  childPrice?: number;

  @Field(() => Int)
  seatsLeft!: number;
}
