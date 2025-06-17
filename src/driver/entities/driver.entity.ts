import { Field, ID, ObjectType, Float, Int } from '@nestjs/graphql';

export enum ApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

@ObjectType()
export class DriverEntity {
  @Field(() => ID)
  id: string = '';

  @Field()
  userId: string = '';

  @Field()
  licenseNumber: string = '';

  @Field()
  licenseClass: string = '';

  @Field()
  licenseExpiry: Date = new Date();

  @Field(() => Int)
  experience: number = 0;

  @Field(() => String)
  status: ApprovalStatus = ApprovalStatus.PENDING;

  @Field({ nullable: true })
  bio?: string;

  @Field(() => [String])
  languages: string[] = [];

  @Field(() => Float, { nullable: true })
  rating?: number;

  @Field()
  createdAt: Date = new Date();

  @Field()
  updatedAt: Date = new Date();

  @Field()
  isActive: boolean = true;

  // Static method to convert Prisma model to entity
  static fromPrisma(driver: any): DriverEntity {
    const entity = new DriverEntity();
    if (!driver) return entity;

    Object.assign(entity, {
      ...driver,
      status: driver.status || ApprovalStatus.PENDING,
      languages: Array.isArray(driver.languages) ? driver.languages : [],
    });
    return entity;
  }
}
