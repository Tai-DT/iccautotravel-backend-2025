import { Field, ID, ObjectType, Float, Int } from '@nestjs/graphql';

// Enum cho trạng thái đánh giá
export enum ReviewStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  HIDDEN = 'HIDDEN',
  PUBLISHED = 'PUBLISHED',
}

@ObjectType()
export class ServiceReviewEntity {
  @Field(() => ID)
  id: string = '';

  @Field()
  serviceId: string = '';

  @Field()
  userId: string = '';

  @Field({ nullable: true })
  bookingId?: string;

  @Field(() => Int)
  rating: number = 0;

  @Field({ nullable: true })
  comment?: string;

  @Field(() => ReviewStatus)
  status: ReviewStatus = ReviewStatus.PENDING;

  @Field()
  createdAt: Date = new Date();

  @Field()
  updatedAt: Date = new Date();

  // Static method to convert data to entity
  static fromPrisma(review: any): ServiceReviewEntity {
    const entity = new ServiceReviewEntity();
    Object.assign(entity, {
      ...review,
      status: review.status || ReviewStatus.PENDING,
    });
    return entity;
  }
}

@ObjectType()
export class ServiceRatingEntity {
  @Field(() => ID)
  id: string = '';

  @Field()
  serviceId: string = '';

  @Field(() => Float)
  averageRating: number = 0;

  @Field(() => Int)
  totalReviews: number = 0;

  @Field(() => Int)
  oneStarCount: number = 0;

  @Field(() => Int)
  twoStarCount: number = 0;

  @Field(() => Int)
  threeStarCount: number = 0;

  @Field(() => Int)
  fourStarCount: number = 0;

  @Field(() => Int)
  fiveStarCount: number = 0;

  @Field()
  createdAt: Date = new Date();

  @Field()
  updatedAt: Date = new Date();

  static fromPrisma(rating: any): ServiceRatingEntity {
    const entity = new ServiceRatingEntity();
    Object.assign(entity, rating);
    return entity;
  }
}
