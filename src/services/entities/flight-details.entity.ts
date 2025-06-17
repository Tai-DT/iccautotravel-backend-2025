import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class FlightDetails {
  @Field()
  airline!: string;

  @Field()
  flightNumber!: string;

  @Field()
  depAirport!: string;

  @Field()
  arrAirport!: string;

  @Field()
  depTime!: Date;

  @Field()
  arrTime!: Date;

  @Field()
  fareClass!: string;

  @Field()
  baggageAllowance!: string;
}
