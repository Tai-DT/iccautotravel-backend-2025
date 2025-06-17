import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DriverReviewEntity } from '../driver/entities/driver-review.entity';
import {
  DriverReviewWhereUniqueInput,
  DriverReviewWhereInput,
  DriverReviewOrderByWithRelationInput,
  DriverReviewInclude,
} from '../driver/interfaces/driver-review.interface';

@Injectable()
export class DriverReviewService {
  private readonly logger = new Logger(DriverReviewService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Find all driver reviews based on the provided parameters
   */
  public async findAll(params: {
    skip?: number;
    take?: number;
    cursor?: DriverReviewWhereUniqueInput;
    where?: DriverReviewWhereInput;
    orderBy?: DriverReviewOrderByWithRelationInput;
    include?: DriverReviewInclude;
  }) {
    const { skip, take, cursor, where, orderBy, include } = params;

    try {
      // Use Prisma's findMany instead of raw queries for better safety
      // Cast parameters to work with Prisma's expected types
      const reviews = await this.prisma.driverReview.findMany({
        skip,
        take,
        cursor: cursor as any,
        where: where as any,
        orderBy: orderBy as any,
        include: include as any,
      });

      return reviews.map((review) => DriverReviewEntity.fromPrisma(review));
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Error in findAll: ${errorMessage}`, errorStack);
      return [];
    }
  }

  /**
   * Find a single driver review by ID
   * @param id The unique ID of the driver review
   * @param include Optional related entities to include in the result
   */
  public async findOne(id: string, include?: DriverReviewInclude) {
    try {
      const review = await this.prisma.driverReview.findUnique({
        where: { id },
        include: include as any,
      });

      if (!review) {
        return null;
      }

      return DriverReviewEntity.fromPrisma(review);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Error in findOne: ${errorMessage}`, errorStack);
      return null;
    }
  }
}
