import { Field, ObjectType, Float } from '@nestjs/graphql';

@ObjectType()
export class VehicleDetails {
  @Field()
  type!: string; // car | bus

  @Field()
  brand!: string;

  @Field()
  model!: string;

  @Field()
  seats!: number;

  @Field()
  licensePlate!: string;

  @Field(() => Float)
  pricePerDay!: number;

  @Field()
  fuelType!: string;

  @Field(() => [String]) // Assuming extras is an array of strings
  extras!: string[];

  @Field(() => Boolean, { defaultValue: false })
  driverIncluded?: boolean;

  @Field(() => Boolean, { defaultValue: false })
  englishSpeakingDriver?: boolean;

  @Field(() => Boolean, { defaultValue: true })
  vietnameseSpeakingDriver?: boolean;

  @Field(() => [String], { nullable: true })
  driverIds?: string[];
}
