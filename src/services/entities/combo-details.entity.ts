import { Field, ObjectType, Float } from '@nestjs/graphql';

@ObjectType()
export class ComboDetails {
  @Field()
  title!: string;

  @Field(() => String, { nullable: true }) // Represent JSON as String
  items?: string; // JSON string containing details of included services

  @Field(() => Float)
  comboPrice!: number;

  @Field(() => Float, { nullable: true })
  discountPercent?: number;

  @Field()
  validity!: string; // e.g., date range or number of days
}
