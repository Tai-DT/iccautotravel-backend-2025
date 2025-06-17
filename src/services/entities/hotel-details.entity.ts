import { Field, ObjectType, Int, Float } from '@nestjs/graphql';

@ObjectType()
export class HotelDetails {
  @Field()
  hotelName!: string;

  @Field()
  roomType!: string;

  @Field(() => Int)
  starRating!: number;

  @Field()
  boardType!: string; // e.g., RO, BB, HB, FB, AI

  @Field(() => Float)
  basePrice!: number;

  @Field(() => Float)
  tax!: number;

  @Field(() => [String]) // Assuming amenities is an array of strings
  amenities!: string[];
}
