import { Field, ID, Int, ObjectType, registerEnumType } from '@nestjs/graphql';

// Define our own ReviewStatus enum since it doesn't exist in Prisma client
export enum ReviewStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

// Register the enum with GraphQL
registerEnumType(ReviewStatus, {
  name: 'ReviewStatus',
  description: 'Status of a review',
});

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

  // Static method to convert Prisma model to entity
  static fromPrisma(data: any): DriverReviewEntity {
    if (!data) {
      return new DriverReviewEntity();
    }

    const entity = new DriverReviewEntity();
    entity.id = data.id || '';
    entity.driverId = data.driverId || '';
    entity.userId = data.userId || '';
    entity.bookingId = data.bookingId;
    entity.rating = data.rating || 0;
    entity.comment = data.comment;
    entity.status = data.status || ReviewStatus.PENDING;
    entity.createdAt = data.createdAt || new Date();
    entity.updatedAt = data.updatedAt || new Date();

    return entity;
  }
}
