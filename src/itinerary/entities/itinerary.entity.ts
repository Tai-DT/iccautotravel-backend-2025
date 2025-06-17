import { ItineraryStatus } from '@prisma/client';
import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ItineraryEntity {
  @Field(() => ID)
  id: string = '';

  @Field()
  title: string = '';

  @Field()
  userId: string = '';

  @Field(() => String)
  status: ItineraryStatus = 'DRAFT';

  @Field(() => Date, { nullable: true })
  startDate: Date | null = null;

  @Field(() => Date, { nullable: true })
  endDate: Date | null = null;

  @Field(() => String, { nullable: true })
  notes: string | null = null;

  @Field(() => Date)
  createdAt: Date = new Date();

  @Field(() => Date)
  updatedAt: Date = new Date();

  // Additional fields for better app UI/UX that are parsed from notes
  @Field({ nullable: true })
  origin?: string = '';

  @Field({ nullable: true })
  destination?: string = '';

  @Field(() => [String], { nullable: true })
  preferences?: string[] = [];

  @Field({ nullable: true })
  budget?: number = 0;

  // Relations
  @Field(() => [String], { nullable: true })
  legs?: string[] = [];
}
