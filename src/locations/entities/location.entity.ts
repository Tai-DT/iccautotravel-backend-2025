import { Field, ID, ObjectType, Float } from '@nestjs/graphql';

export enum LocationType {
  CITY = 'CITY',
  PROVINCE = 'PROVINCE',
  DISTRICT = 'DISTRICT',
  WARD = 'WARD',
  LANDMARK = 'LANDMARK',
  AIRPORT = 'AIRPORT',
  HOTEL = 'HOTEL',
  RESTAURANT = 'RESTAURANT',
  ATTRACTION = 'ATTRACTION',
  OTHER = 'OTHER',
}

@ObjectType({ description: 'Location entity' })
export class LocationEntity {
  @Field(() => ID)
  id: string = '';

  @Field()
  name: string = '';

  @Field({ nullable: true })
  address?: string;

  @Field({ nullable: true })
  district?: string;

  @Field({ nullable: true })
  city?: string = '';

  @Field({ nullable: true })
  country?: string = '';

  @Field({ nullable: true })
  zipCode?: string;

  @Field(() => Float, { nullable: true })
  latitude?: number;

  @Field(() => Float, { nullable: true })
  longitude?: number;

  @Field(() => LocationType)
  type: LocationType = LocationType.OTHER;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  imageUrl?: string;

  @Field()
  isActive: boolean = true;

  @Field({ defaultValue: false })
  isPopular: boolean = false;

  @Field()
  createdAt: Date = new Date();

  @Field()
  updatedAt: Date = new Date();
}
