import { Field, ObjectType, Float, Int } from '@nestjs/graphql';

@ObjectType()
export class TransferDetails {
  @Field()
  vehicleType!: string;

  @Field()
  route!: string;

  @Field(() => Float)
  distanceKm!: number;

  @Field(() => Int, { nullable: true })
  waitTime?: number; // in minutes

  @Field(() => Float)
  price!: number;
}
