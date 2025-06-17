import { Field, ObjectType, Float } from '@nestjs/graphql';

@ObjectType()
export class VisaDetails {
  @Field(() => String, { nullable: true }) // Represent JSON as String
  applicantInfo?: string;

  @Field()
  visaType!: string;

  @Field()
  country!: string;

  @Field()
  serviceLevel!: string;

  @Field(() => Float)
  fee!: number;

  @Field()
  status!: string;
}
