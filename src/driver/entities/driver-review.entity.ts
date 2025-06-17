import { Field, ID, ObjectType, Float, Int } from '@nestjs/graphql';
import { DriverEntity } from './driver.entity';

// Enum cho trạng thái đánh giá
export enum ReviewStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  HIDDEN = 'HIDDEN',
}

@ObjectType()
export class DriverReviewEntity {
  @Field(() => ID)
  id: string = '';

  @Field()
  driverId: string = '';

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

  @Field(() => DriverEntity, { nullable: true })
  driver?: DriverEntity;

  static fromPrisma(review: any): DriverReviewEntity {
    const entity = new DriverReviewEntity();
    Object.assign(entity, {
      ...review,
      driver: review.driver
        ? DriverEntity.fromPrisma(review.driver)
        : undefined,
    });
    return entity;
  }
}

@ObjectType()
export class DriverRatingEntity {
  @Field(() => ID)
  id: string = '';

  @Field()
  driverId: string = '';

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

  static fromPrisma(rating: any): DriverRatingEntity {
    const entity = new DriverRatingEntity();
    Object.assign(entity, rating);
    return entity;
  }
}
