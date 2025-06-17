import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { ReviewStatus } from '../dto/service-review.dto';
import {
  ServiceRatingEntity,
  ServiceReviewEntity,
} from './entities/service-review.entity';

// Define custom types since they don't exist in Prisma client
type ServiceReviewWhereUniqueInput = {
  id?: string;
};

type ServiceReviewWhereInput = {
  id?: string;
  serviceId?: string;
  userId?: string;
  bookingId?: string;
  status?: ReviewStatus;
  [key: string]: any;
};

type ServiceReviewOrderByWithRelationInput = {
  createdAt?: 'asc' | 'desc';
  updatedAt?: 'asc' | 'desc';
  rating?: 'asc' | 'desc';
  [key: string]: any;
};

type ServiceReviewInclude = {
  service?: boolean;
  user?: {
    select: {
      id: boolean;
      fullName: boolean;
      avatarUrl: boolean;
    };
  };
  [key: string]: any;
};

@Injectable()
export class ServiceReviewService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: {
    skip?: number;
    take?: number;
    cursor?: ServiceReviewWhereUniqueInput;
    where?: ServiceReviewWhereInput;
    orderBy?: ServiceReviewOrderByWithRelationInput;
    include?: ServiceReviewInclude;
  }) {
    const { skip, take, where, orderBy, include } = params;

    try {
      // Build WHERE condition safely
      const whereCondition: any = {};
      if (where) {
        if (where.id) whereCondition.id = where.id;
        if (where.serviceId) whereCondition.serviceId = where.serviceId;
        if (where.userId) whereCondition.userId = where.userId;
        if (where.bookingId) whereCondition.bookingId = where.bookingId;
        if (where.status) whereCondition.status = where.status;
      }

      // Build ORDER BY condition safely (avoid reviewDate)
      const orderByCondition: any = {};
      if (orderBy) {
        for (const [key, value] of Object.entries(orderBy)) {
          // Only allow valid column names, explicitly exclude reviewDate
          if (
            ['id', 'createdAt', 'updatedAt', 'rating', 'status'].includes(key)
          ) {
            orderByCondition[key] = value;
          }
        }
      }

      // Default to createdAt desc if no valid orderBy
      if (Object.keys(orderByCondition).length === 0) {
        orderByCondition.createdAt = 'desc';
      }

      // Build include condition
      const includeCondition: any = {};
      if (include?.user) {
        includeCondition.User = {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        };
      }
      if (include?.service) {
        includeCondition.Service = true;
      }

      // Execute query with Prisma
      const reviews = await this.prisma.serviceReview.findMany({
        where: whereCondition,
        orderBy: orderByCondition,
        take: take ? parseInt(String(take), 10) : undefined,
        skip: skip ? parseInt(String(skip), 10) : undefined,
        include: includeCondition,
      });

      return reviews;
    } catch (error) {
      console.error('Error in findAll:', error);
      throw new Error(
        `Failed to fetch reviews: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async findOne(id: string, include?: ServiceReviewInclude) {
    try {
      const includeCondition: any = {};

      if (include?.user) {
        includeCondition.User = {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        };
      }

      if (include?.service) {
        includeCondition.Service = true;
      }

      const review = await this.prisma.serviceReview.findUnique({
        where: { id },
        include: includeCondition,
      });

      return review;
    } catch (error) {
      console.error('Error in findOne:', error);
      throw new Error(
        `Failed to fetch review: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async create(data: any) {
    // Extract data for the review
    const id = data.id || `review_${Math.random().toString(36).substr(2, 9)}`;
    const serviceId = data.service?.connect?.id || data.serviceId;
    const userId = data.user?.connect?.id || data.userId;
    const bookingId = data.booking?.connect?.id || data.bookingId;
    const rating = data.rating;
    const content = data.content;
    const status = data.status || ReviewStatus.PENDING;
    const createdAt = data.createdAt || new Date();
    const updatedAt = data.updatedAt || new Date();

    // Create the review
    const review = await this.prisma.$queryRaw<any[]>`
      INSERT INTO "ServiceReview" (
        "id", "serviceId", "userId", "bookingId", "rating", 
        "comment", "status", "createdAt", "updatedAt"
      )
      VALUES (
        ${id}, ${serviceId}, ${userId}, ${bookingId}, ${rating},
        ${content}, ${status}, ${createdAt}, ${updatedAt}
      )
      RETURNING *
    `;

    // Get the created review
    const createdReview = review[0];

    // Fetch service data
    const services = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM "Service" WHERE id = ${serviceId}
    `;

    if (services && services.length > 0) {
      createdReview.service = services[0];
    }

    // Fetch user data
    const users = await this.prisma.$queryRaw<any[]>`
      SELECT id, "fullName", "avatarUrl" FROM "User" WHERE id = ${userId}
    `;

    if (users && users.length > 0) {
      createdReview.user = users[0];
    }

    // Update service rating
    await this.updateServiceRating(serviceId);

    return createdReview;
  }

  async update(params: { where: ServiceReviewWhereUniqueInput; data: any }) {
    const { where, data } = params;

    // Get the review to update
    const existingReviews = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM "ServiceReview" WHERE id = ${where.id}
    `;

    if (!existingReviews || existingReviews.length === 0) {
      return null;
    }

    // Used to get serviceId for rating update
    const existingReview = existingReviews[0];

    // Build SET clause for SQL query
    const setClause = Object.entries(data)
      .filter(([_, value]) => {
        // Skip nested objects like connect/disconnect
        return typeof value !== 'object' || value === null;
      })
      .map(([key, value]) => {
        if (value === null) return `"${key}" = NULL`;
        if (typeof value === 'string') return `"${key}" = '${value}'`;
        if (value instanceof Date) return `"${key}" = '${value.toISOString()}'`;
        return `"${key}" = ${value}`;
      })
      .join(', ');

    // Update the review
    const updatedReviews = await this.prisma.$queryRaw<any[]>`
      UPDATE "ServiceReview" 
      SET ${Prisma.raw(setClause)}, "updatedAt" = NOW()
      WHERE id = ${where.id}
      RETURNING *
    `;

    const updatedReview = updatedReviews[0];

    // Fetch service data
    const services = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM "Service" WHERE id = ${updatedReview.serviceId}
    `;

    if (services && services.length > 0) {
      updatedReview.service = services[0];
    }

    // Fetch user data
    const users = await this.prisma.$queryRaw<any[]>`
      SELECT id, "fullName", "avatarUrl" FROM "User" WHERE id = ${updatedReview.userId}
    `;

    if (users && users.length > 0) {
      updatedReview.user = users[0];
    }

    // Update service rating if rating or status changed
    if (data.rating || data.status) {
      await this.updateServiceRating(existingReview.serviceId);
    }

    return updatedReview;
  }

  async delete(where: ServiceReviewWhereUniqueInput) {
    // Get the review before deleting
    const reviews = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM "ServiceReview" WHERE id = ${where.id}
    `;

    if (!reviews || reviews.length === 0) {
      return null;
    }

    const review = reviews[0];

    // Delete the review
    const deletedReviews = await this.prisma.$queryRaw<any[]>`
      DELETE FROM "ServiceReview" 
      WHERE id = ${where.id}
      RETURNING *
    `;

    // Update service rating
    await this.updateServiceRating(review.serviceId);

    return deletedReviews[0];
  }

  // Phương thức cập nhật thống kê rating của dịch vụ
  async updateServiceRating(serviceId: string) {
    // Lấy tất cả đánh giá của dịch vụ
    const reviews = await this.prisma.$queryRaw`
      SELECT * FROM "ServiceReview" 
      WHERE "serviceId" = ${serviceId}
      AND "status" = ${ReviewStatus.APPROVED}
    `;

    // Tính toán thống kê rating
    let averageRating = 0;
    const reviewsArray = reviews as any[];
    let totalReviews = reviewsArray.length;
    let oneStarReviews = 0;
    let twoStarReviews = 0;
    let threeStarReviews = 0;
    let fourStarReviews = 0;
    let fiveStarReviews = 0;

    if (totalReviews > 0) {
      oneStarReviews = reviewsArray.filter((r: any) => r.rating === 1).length;
      twoStarReviews = reviewsArray.filter((r: any) => r.rating === 2).length;
      threeStarReviews = reviewsArray.filter((r: any) => r.rating === 3).length;
      fourStarReviews = reviewsArray.filter((r: any) => r.rating === 4).length;
      fiveStarReviews = reviewsArray.filter((r: any) => r.rating === 5).length;

      const sumRating = reviewsArray.reduce(
        (sum: number, review: any) => sum + review.rating,
        0,
      );
      averageRating = sumRating / totalReviews;
    }

    // Cập nhật hoặc tạo mới bảng ServiceRating
    return this.prisma.$queryRaw`
      INSERT INTO "ServiceRating" (
        "id", "serviceId", "averageRating", "totalReviews", 
        "oneStarCount", "twoStarCount", "threeStarCount", 
        "fourStarCount", "fiveStarCount", "createdAt", "updatedAt"
      )
      VALUES (
        ${`service_rating_${serviceId}`}, ${serviceId}, ${averageRating}, ${totalReviews},
        ${oneStarReviews}, ${twoStarReviews}, ${threeStarReviews},
        ${fourStarReviews}, ${fiveStarReviews}, ${new Date()}, ${new Date()}
      )
      ON CONFLICT ("serviceId")
      DO UPDATE SET
        "averageRating" = ${averageRating},
        "totalReviews" = ${totalReviews},
        "oneStarCount" = ${oneStarReviews},
        "twoStarCount" = ${twoStarReviews},
        "threeStarCount" = ${threeStarReviews},
        "fourStarCount" = ${fourStarReviews},
        "fiveStarCount" = ${fiveStarReviews},
        "updatedAt" = ${new Date()}
      RETURNING *
    `;
  }

  // Lấy tất cả đánh giá của một dịch vụ
  async findServiceReviews(
    serviceId: string,
    status: ReviewStatus = ReviewStatus.PUBLISHED,
    options?: { skip?: number; take?: number },
  ) {
    // Get reviews
    const reviews = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM "ServiceReview" 
      WHERE "serviceId" = ${serviceId} AND "status" = ${status}
      ORDER BY "createdAt" DESC
      ${options?.take ? Prisma.raw(`LIMIT ${options.take}`) : Prisma.raw('')}
      ${options?.skip ? Prisma.raw(`OFFSET ${options.skip}`) : Prisma.raw('')}
    `;

    // Get user data for each review
    if (reviews && reviews.length > 0) {
      const userIds = reviews.map((review) => review.userId);
      const uniqueUserIds = [...new Set(userIds)];

      const users = await this.prisma.$queryRaw<any[]>`
        SELECT id, "fullName", "avatarUrl" FROM "User" 
        WHERE id IN (${Prisma.raw(uniqueUserIds.map((id) => `'${id}'`).join(', '))})
      `;

      // Create a map of users by ID for quick lookup
      const userMap: Record<string, any> = {};
      users.forEach((user) => {
        userMap[user.id] = user;
      });

      // Add user data to each review
      reviews.forEach((review) => {
        review.user = userMap[review.userId] || null;
      });
    }

    return reviews;
  }

  // Kiểm tra xem người dùng có thể đánh giá dịch vụ không
  async canReviewService(
    userId: string,
    serviceId: string,
    bookingId?: string,
  ): Promise<{ canReview: boolean; reason: string | null }> {
    // Kiểm tra xem người dùng đã đánh giá dịch vụ này chưa
    const existingReview = await this.prisma.$queryRaw`
      SELECT * FROM "ServiceReview"
      WHERE "serviceId" = ${serviceId} AND "userId" = ${userId}
      LIMIT 1
    `;

    if (
      existingReview &&
      Array.isArray(existingReview) &&
      existingReview.length > 0
    ) {
      return { canReview: false, reason: 'Bạn đã đánh giá dịch vụ này rồi' };
    }

    // Nếu có bookingId, kiểm tra xem booking có phải của user và có bao gồm service này không
    if (bookingId) {
      const booking = await this.prisma.$queryRaw`
        SELECT b.* FROM "Booking" b
        JOIN "BookingDetail" bd ON b.id = bd."bookingId"
        WHERE b.id = ${bookingId} 
        AND b."userId" = ${userId}
        AND bd."serviceId" = ${serviceId}
        AND b.status = 'COMPLETED'
        LIMIT 1
      `;

      const bookingExists =
        booking && Array.isArray(booking) && booking.length > 0;
      return {
        canReview: Boolean(bookingExists),
        reason: bookingExists
          ? null
          : 'Bạn không thể đánh giá dịch vụ này với booking đã chọn',
      };
    }

    // Nếu không có bookingId, kiểm tra xem người dùng đã từng sử dụng dịch vụ này chưa
    const userBookings = await this.prisma.$queryRaw`
      SELECT b.* FROM "Booking" b
      JOIN "BookingDetail" bd ON b.id = bd."bookingId"
      WHERE b."userId" = ${userId}
      AND bd."serviceId" = ${serviceId}
      AND b.status = 'COMPLETED'
      LIMIT 1
    `;

    const hasUsedService =
      userBookings && Array.isArray(userBookings) && userBookings.length > 0;
    return {
      canReview: Boolean(hasUsedService),
      reason: hasUsedService
        ? null
        : 'Bạn cần sử dụng dịch vụ này trước khi đánh giá',
    };
  }

  // Lấy đánh giá của dịch vụ theo trạng thái
  async getReviewsByStatus(status: ReviewStatus, take = 10, skip = 0) {
    const reviews = await this.prisma.$queryRaw`
      SELECT * FROM "ServiceReview"
      WHERE "status" = ${status}
      ORDER BY "updatedAt" DESC
      LIMIT ${take}
      OFFSET ${skip}
    `;

    return Array.isArray(reviews)
      ? reviews.map((review) => ServiceReviewEntity.fromPrisma(review))
      : [];
  }

  // Đếm số lượng đánh giá
  async count(where: any) {
    let whereClause = 'TRUE';

    if (where) {
      // Build WHERE clause dynamically based on the where input
      // This is a simplified version - in a real app, you'd want to handle this more robustly
      if (where.serviceId) {
        whereClause += ` AND "serviceId" = '${where.serviceId}'`;
      }

      if (where.userId) {
        whereClause += ` AND "userId" = '${where.userId}'`;
      }

      if (where.status) {
        whereClause += ` AND "status" = '${where.status}'`;
      }
    }

    const result = await this.prisma.$queryRawUnsafe(
      `SELECT COUNT(*) as count FROM "ServiceReview" WHERE ${whereClause}`,
    );

    return parseInt(String((result as any[])[0]?.count || '0'), 10);
  }

  // Lấy đánh giá tổng hợp cho một dịch vụ
  async getServiceRating(serviceId: string) {
    const rating = await this.prisma.$queryRaw`
      SELECT * FROM "ServiceRating"
      WHERE "serviceId" = ${serviceId}
    `;

    return rating && Array.isArray(rating) && rating.length > 0
      ? ServiceRatingEntity.fromPrisma(rating[0])
      : null;
  }

  // Lấy các dịch vụ được đánh giá cao nhất
  async getBestRatedServices(limit = 5) {
    const services = await this.prisma.$queryRaw`
      SELECT s.*, r.* 
      FROM "Service" s
      JOIN "ServiceRating" r ON s."id" = r."serviceId"
      WHERE s."isActive" = true AND s."isDeleted" = false
      ORDER BY r."averageRating" DESC, r."totalReviews" DESC
      LIMIT ${limit}
    `;

    return Array.isArray(services) ? services : [];
  }
}
