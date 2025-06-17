import { Field, ID, ObjectType, Float, Int } from '@nestjs/graphql';
import { Decimal } from '@prisma/client/runtime/library';
import { DriverEntity } from './driver.entity';

@ObjectType()
export class DriverStatisticsEntity {
  @Field(() => ID)
  id: string = '';

  @Field()
  driverId: string = '';

  @Field(() => Int)
  totalTrips: number = 0;

  @Field(() => Float)
  totalEarnings: number = 0;

  @Field(() => Float, { nullable: true })
  averageRating: number | null = null;

  @Field(() => Float)
  cancellationRate: number = 0;

  @Field(() => Float)
  completionRate: number = 0;

  @Field(() => Date, { nullable: true })
  lastActiveDate: Date | null = null;

  @Field()
  createdAt: Date = new Date();

  @Field()
  updatedAt: Date = new Date();

  @Field(() => DriverEntity, { nullable: true })
  driver?: DriverEntity;

  static fromPrisma(stats: any): DriverStatisticsEntity {
    const entity = new DriverStatisticsEntity();
    Object.assign(entity, {
      ...stats,
      totalEarnings:
        stats.totalEarnings instanceof Decimal
          ? parseFloat(stats.totalEarnings.toString())
          : stats.totalEarnings,
      driver: stats.driver ? DriverEntity.fromPrisma(stats.driver) : undefined,
    });
    return entity;
  }
}

// Interface cho các phương thức Prisma cần thiết
export interface DriverWhereUniqueInput {
  id?: string;
  userId?: string;
  licenseNumber?: string;
}

export interface DriverWhereInput {
  id?: { equals?: string } | string;
  userId?: { equals?: string } | string;
  status?: { equals?: ApprovalStatus } | ApprovalStatus;
  isActive?: { equals?: boolean } | boolean;
  licenseNumber?: { contains?: string } | string;
  [key: string]: any;
}

export interface DriverOrderByWithRelationInput {
  id?: 'asc' | 'desc';
  createdAt?: 'asc' | 'desc';
  updatedAt?: 'asc' | 'desc';
  [key: string]: any;
}

export interface DriverInclude {
  user?: boolean;
  driverReviews?: boolean;
  driverStatistics?: boolean;
  [key: string]: any;
}

export interface DriverCreateInput {
  id: string;
  userId: string;
  licenseNumber: string;
  licenseClass: string;
  licenseExpiry: Date;
  experience?: number;
  status?: ApprovalStatus;
  bio?: string;
  languages?: string[];
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  [key: string]: any;
}

export interface DriverUpdateInput {
  licenseNumber?: string;
  licenseClass?: string;
  licenseExpiry?: Date;
  experience?: number;
  status?: ApprovalStatus;
  bio?: string;
  languages?: string[];
  isActive?: boolean;
  updatedAt?: Date;
  [key: string]: any;
}

// Enum for ApprovalStatus
export enum ApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}
