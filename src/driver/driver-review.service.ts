import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  DriverReviewEntity,
  ReviewStatus,
} from './entities/driver-review.entity';
import {
  DriverReviewCreateInput,
  DriverReviewInclude,
  DriverReviewOrderByWithRelationInput,
  DriverReviewUpdateInput,
  DriverReviewWhereInput,
  DriverReviewWhereUniqueInput,
} from './interfaces/driver-review.interface';

@Injectable()
export class DriverReviewService {
  private readonly logger = new Logger(DriverReviewService.name);

  constructor(private prisma: PrismaService) {}

  async findAll(params: {
    skip?: number;
    take?: number;
    cursor?: DriverReviewWhereUniqueInput;
    where?: DriverReviewWhereInput;
    orderBy?: DriverReviewOrderByWithRelationInput;
    include?: DriverReviewInclude;
  }) {
    const { skip, take, cursor, where, orderBy, include } = params;

    try {
      // Sử dụng Prisma API an toàn thay vì raw SQL queries
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

  async findOne(id: string, include?: DriverReviewInclude) {
    try {
      // Sử dụng Prisma API an toàn thay vì raw SQL queries
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

  async create(data: DriverReviewCreateInput) {
    try {
      const review = await this.prisma.driverReview.create({
        data: data as any,
      });

      // Cập nhật thống kê rating của tài xế
      await this.updateDriverRating(review.driverId);

      return DriverReviewEntity.fromPrisma(review);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Error in create: ${errorMessage}`, errorStack);
      throw new Error(`Failed to create driver review: ${errorMessage}`);
    }
  }

  async update(params: {
    where: DriverReviewWhereUniqueInput;
    data: DriverReviewUpdateInput;
  }) {
    try {
      const { where, data } = params;

      const review = await this.prisma.driverReview.update({
        where: where as any,
        data: data as any,
      });

      // Cập nhật thống kê rating nếu rating thay đổi
      if (data.rating) {
        await this.updateDriverRating(review.driverId);
      }

      return DriverReviewEntity.fromPrisma(review);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Error in update: ${errorMessage}`, errorStack);
      throw new Error(`Failed to update driver review: ${errorMessage}`);
    }
  }

  async delete(where: DriverReviewWhereUniqueInput) {
    try {
      const review = await this.prisma.driverReview.delete({
        where: where as any,
      });

      // Cập nhật thống kê rating của tài xế
      await this.updateDriverRating(review.driverId);

      return DriverReviewEntity.fromPrisma(review);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Error in delete: ${errorMessage}`, errorStack);
      throw new Error(`Failed to delete driver review: ${errorMessage}`);
    }
  }

  // Phương thức cập nhật thống kê rating của tài xế
  async updateDriverRating(driverId: string) {
    const reviews = await this.prisma.driverReview.findMany({
      where: {
        driverId,
        status: ReviewStatus.APPROVED,
      },
    });

    let averageRating = 0;
    let totalReviews = reviews.length;
    let oneStarReviews = 0;
    let twoStarReviews = 0;
    let threeStarReviews = 0;
    let fourStarReviews = 0;
    let fiveStarReviews = 0;

    if (totalReviews > 0) {
      oneStarReviews = reviews.filter((r) => r.rating === 1).length;
      twoStarReviews = reviews.filter((r) => r.rating === 2).length;
      threeStarReviews = reviews.filter((r) => r.rating === 3).length;
      fourStarReviews = reviews.filter((r) => r.rating === 4).length;
      fiveStarReviews = reviews.filter((r) => r.rating === 5).length;

      const sumRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      averageRating = sumRating / totalReviews;
    }

    await this.prisma.driverRating.upsert({
      where: { driverId },
      create: {
        id: `driver_rating_${driverId}`,
        driverId,
        averageRating,
        totalReviews,
        oneStarCount: oneStarReviews,
        twoStarCount: twoStarReviews,
        threeStarCount: threeStarReviews,
        fourStarCount: fourStarReviews,
        fiveStarCount: fiveStarReviews,
        updatedAt: new Date(),
      },
      update: {
        averageRating,
        totalReviews,
        oneStarCount: oneStarReviews,
        twoStarCount: twoStarReviews,
        threeStarCount: threeStarReviews,
        fourStarCount: fourStarReviews,
        fiveStarCount: fiveStarReviews,
        updatedAt: new Date(),
      },
    });
  }

  // Lấy đánh giá của tài xế theo trạng thái
  async getReviewsByStatus(status: ReviewStatus, take = 10, skip = 0) {
    const reviews = await this.prisma.driverReview.findMany({
      where: { status },
      orderBy: { updatedAt: 'desc' },
      take,
      skip,
    });

    return reviews.map((review) => DriverReviewEntity.fromPrisma(review));
  }

  // Kiểm tra xem người dùng đã đánh giá tài xế cho booking cụ thể chưa
  async checkUserReviewedDriver(
    driverId: string,
    userId: string,
    bookingId?: string,
  ) {
    const review = await this.prisma.driverReview.findFirst({
      where: {
        driverId,
        userId,
        bookingId,
      },
    });

    return review ? DriverReviewEntity.fromPrisma(review) : null;
  }

  // Kiểm tra xem người dùng có thể đánh giá tài xế cho booking cụ thể hay không
  async canReviewDriver(userId: string, driverId: string, bookingId: string) {
    const booking = await this.prisma.booking.findFirst({
      where: {
        id: bookingId,
        userId,
      },
    });

    if (!booking) {
      return {
        canReview: false,
        reason: 'Booking not found or not assigned to this driver',
      };
    }

    const existingReview = await this.prisma.driverReview.findFirst({
      where: {
        driverId,
        userId,
        bookingId,
      },
    });

    if (existingReview) {
      return {
        canReview: false,
        reason: 'You have already reviewed this driver for this booking',
      };
    }

    return { canReview: true };
  }
}
