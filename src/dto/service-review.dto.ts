import { Field, InputType, Int, registerEnumType } from '@nestjs/graphql';

export enum ReviewStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  HIDDEN = 'HIDDEN',
  PUBLISHED = 'PUBLISHED',
}

registerEnumType(ReviewStatus, {
  name: 'ReviewStatus',
  description: 'Review status enum',
});

@InputType()
export class CreateServiceReviewInput {
  @Field(() => String)
  serviceId: string = '';

  @Field(() => Int)
  rating: number = 0;

  @Field(() => String)
  content: string = '';

  @Field(() => String, { nullable: true })
  bookingId?: string;

  @Field(() => ReviewStatus, { nullable: true })
  status?: ReviewStatus;
}

@InputType()
export class UpdateServiceReviewInput {
  @Field(() => Int, { nullable: true })
  rating?: number;

  @Field(() => String, { nullable: true })
  content?: string;

  @Field(() => ReviewStatus, { nullable: true })
  status?: ReviewStatus;
}
