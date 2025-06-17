import { Field, ObjectType, Float } from '@nestjs/graphql';

@ObjectType()
export class InsuranceDetails {
  @Field()
  insurer!: string;

  @Field()
  planCode!: string;

  @Field()
  coverage!: string;

  @Field(() => Float)
  premium!: number;

  @Field()
  policyNumber!: string;

  @Field()
  effectiveDate!: Date;
}
