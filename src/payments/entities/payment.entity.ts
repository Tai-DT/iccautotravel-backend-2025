import { Field, Float, ID, ObjectType } from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-scalars';

@ObjectType()
export class PaymentEntity {
  @Field(() => ID)
  id!: string;

  @Field()
  bookingId!: string;

  @Field({ nullable: true })
  provider?: string;

  @Field({ nullable: true })
  txnRef?: string;

  @Field(() => Float)
  amount!: number;

  @Field()
  currency!: string;

  @Field()
  status!: string;

  @Field({ nullable: true })
  paidAt?: Date;

  @Field({ nullable: true })
  paymentMethod?: string;

  @Field(() => GraphQLJSON, { nullable: true })
  metadata?: any;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;

  constructor(partial: Partial<PaymentEntity>) {
    Object.assign(this, partial);
  }
}
