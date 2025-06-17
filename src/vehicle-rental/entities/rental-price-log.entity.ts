import { Field, ID, ObjectType, Float } from '@nestjs/graphql';

@ObjectType()
export class RentalPriceLogEntity {
  @Field(() => ID)
  id: string = '';

  @Field()
  vehicleTypeId: string = '';

  @Field(() => String, { nullable: true })
  regionId?: string | null;

  @Field(() => Float)
  price: number = 0;

  @Field()
  currency: string = 'VND';

  @Field()
  priceDate: Date = new Date();

  @Field()
  userId: string = '';

  @Field({ nullable: true })
  notes?: string;

  @Field()
  createdAt: Date = new Date();

  static fromPrisma(data: any): RentalPriceLogEntity {
    const entity = new RentalPriceLogEntity();
    if (!data) return entity;

    Object.assign(entity, {
      ...data,
      price: parseFloat(data.price),
    });

    return entity;
  }
}
