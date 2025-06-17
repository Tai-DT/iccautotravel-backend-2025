import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  DriverReviewEntity,
  ReviewStatus,
} from './entities/driver-review.entity';
import { CreateDriverReviewInput } from './dto/create-driver-review.input';
import { UpdateDriverReviewInput } from './dto/update-driver-review.input';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class DriverReviewService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDriverReviewInput: CreateDriverReviewInput) {
    try {
      // Check if driver exists - use any role since DRIVER role doesn't exist in the enum
      const driverExists = await this.prisma.user.findUnique({
        where: { id: createDriverReviewInput.driverId },
      });

      if (!driverExists) {
        throw new NotFoundException(
          `Driver with ID ${createDriverReviewInput.driverId} not found`,
        );
      }

      // Additional check for driver status if needed
      if (
        !driverExists.driverStatus ||
        driverExists.driverStatus !== 'APPROVED'
      ) {
        throw new NotFoundException(
          `User with ID ${createDriverReviewInput.driverId} is not an approved driver`,
        );
      }

      // Check if user exists
      const userExists = await this.prisma.user.findUnique({
        where: { id: createDriverReviewInput.userId },
      });

      if (!userExists) {
        throw new NotFoundException(
          `User with ID ${createDriverReviewInput.userId} not found`,
        );
      }

      // Check if booking exists if bookingId is provided
      if (createDriverReviewInput.bookingId) {
        const bookingExists = await this.prisma.booking.findUnique({
          where: { id: createDriverReviewInput.bookingId },
        });

        if (!bookingExists) {
          throw new NotFoundException(
            `Booking with ID ${createDriverReviewInput.bookingId} not found`,
          );
        }
      }

      // Check if a review already exists for this combination
      const existingReview = await this.prisma.driverReview.findFirst({
        where: {
          driverId: createDriverReviewInput.driverId,
          userId: createDriverReviewInput.userId,
          bookingId: createDriverReviewInput.bookingId || null,
        },
      });

      if (existingReview) {
        throw new Error(
          'A review already exists for this driver, user and booking combination',
        );
      }

      const driverReview = await this.prisma.driverReview.create({
        data: {
          id: `driver_review_${uuidv4()}`,
          driverId: createDriverReviewInput.driverId,
          userId: createDriverReviewInput.userId,
          bookingId: createDriverReviewInput.bookingId,
          rating: createDriverReviewInput.rating,
          comment: createDriverReviewInput.comment,
          status: ReviewStatus.PENDING,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Update driver rating statistics
      await this.updateDriverRatingStatistics(createDriverReviewInput.driverId);

      return DriverReviewEntity.fromPrisma(driverReview);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error creating driver review:', error);
      throw new InternalServerErrorException('Failed to create driver review');
    }
  }

  async findAll() {
    try {
      const reviews = await this.prisma.driverReview.findMany();
      return reviews.map((review) => DriverReviewEntity.fromPrisma(review));
    } catch (error) {
      console.error('Error finding all driver reviews:', error);
      throw new InternalServerErrorException(
        'Failed to retrieve driver reviews',
      );
    }
  }

  async findByDriver(driverId: string) {
    try {
      const driverExists = await this.prisma.user.findUnique({
        where: { id: driverId },
      });

      if (!driverExists) {
        throw new NotFoundException(`Driver with ID ${driverId} not found`);
      }

      const reviews = await this.prisma.driverReview.findMany({
        where: { driverId },
      });

      return reviews.map((review) => DriverReviewEntity.fromPrisma(review));
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error(`Error finding reviews for driver ${driverId}:`, error);
      throw new InternalServerErrorException(
        'Failed to retrieve driver reviews',
      );
    }
  }

  async findOne(id: string) {
    try {
      const review = await this.prisma.driverReview.findUnique({
        where: { id },
      });

      if (!review) {
        throw new NotFoundException(`Driver review with ID ${id} not found`);
      }

      return DriverReviewEntity.fromPrisma(review);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error(`Error finding driver review with ID ${id}:`, error);
      throw new InternalServerErrorException(
        'Failed to retrieve driver review',
      );
    }
  }

  async update(id: string, updateDriverReviewInput: UpdateDriverReviewInput) {
    try {
      const existingReview = await this.prisma.driverReview.findUnique({
        where: { id },
      });

      if (!existingReview) {
        throw new NotFoundException(`Driver review with ID ${id} not found`);
      }

      const updatedReview = await this.prisma.driverReview.update({
        where: { id },
        data: {
          ...updateDriverReviewInput,
          updatedAt: new Date(),
        },
      });

      // If rating was updated, recalculate driver rating statistics
      if (updateDriverReviewInput.rating) {
        await this.updateDriverRatingStatistics(existingReview.driverId);
      }

      return DriverReviewEntity.fromPrisma(updatedReview);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error(`Error updating driver review with ID ${id}:`, error);
      throw new InternalServerErrorException('Failed to update driver review');
    }
  }

  async remove(id: string) {
    try {
      const existingReview = await this.prisma.driverReview.findUnique({
        where: { id },
      });

      if (!existingReview) {
        throw new NotFoundException(`Driver review with ID ${id} not found`);
      }

      const driverId = existingReview.driverId;

      await this.prisma.driverReview.delete({
        where: { id },
      });

      // Recalculate driver rating statistics after deletion
      await this.updateDriverRatingStatistics(driverId);

      return { success: true, message: 'Driver review deleted successfully' };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error(`Error removing driver review with ID ${id}:`, error);
      throw new InternalServerErrorException('Failed to remove driver review');
    }
  }

  async updateStatus(id: string, status: ReviewStatus) {
    try {
      const existingReview = await this.prisma.driverReview.findUnique({
        where: { id },
      });

      if (!existingReview) {
        throw new NotFoundException(`Driver review with ID ${id} not found`);
      }

      const updatedReview = await this.prisma.driverReview.update({
        where: { id },
        data: {
          status,
          updatedAt: new Date(),
        },
      });

      // If review status was changed to APPROVED or from APPROVED, update rating statistics
      if (
        existingReview.status !== status &&
        (status === ReviewStatus.APPROVED ||
          existingReview.status === ReviewStatus.APPROVED)
      ) {
        await this.updateDriverRatingStatistics(existingReview.driverId);
      }

      return DriverReviewEntity.fromPrisma(updatedReview);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error(
        `Error updating status of driver review with ID ${id}:`,
        error,
      );
      throw new InternalServerErrorException(
        'Failed to update driver review status',
      );
    }
  }

  private async updateDriverRatingStatistics(driverId: string) {
    try {
      // Get all approved reviews for this driver
      const reviews = await this.prisma.driverReview.findMany({
        where: {
          driverId,
          status: ReviewStatus.APPROVED,
        },
      });

      // Calculate rating statistics
      const totalReviews = reviews.length;
      const ratings: Record<number, number> = {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
      };

      let totalRatingSum = 0;

      reviews.forEach((review) => {
        const rating = review.rating;
        totalRatingSum += rating;
        // Add type safety check to ensure rating is a valid key
        if (rating >= 1 && rating <= 5) {
          ratings[rating]++;
        }
      });

      const averageRating =
        totalReviews > 0
          ? parseFloat((totalRatingSum / totalReviews).toFixed(1))
          : 0;

      // Update or create driver rating record
      await this.prisma.driverRating.upsert({
        where: { driverId },
        create: {
          id: `driver_rating_${uuidv4()}`,
          driverId,
          averageRating,
          totalReviews,
          oneStarCount: ratings[1],
          twoStarCount: ratings[2],
          threeStarCount: ratings[3],
          fourStarCount: ratings[4],
          fiveStarCount: ratings[5],
          updatedAt: new Date(),
        },
        update: {
          averageRating,
          totalReviews,
          oneStarCount: ratings[1],
          twoStarCount: ratings[2],
          threeStarCount: ratings[3],
          fourStarCount: ratings[4],
          fiveStarCount: ratings[5],
          updatedAt: new Date(),
        },
      });

      // Update the user's rating field for quick access (since driver is a user with DRIVER role)
      await this.prisma.user.update({
        where: { id: driverId },
        data: {
          rating: averageRating,
          updatedAt: new Date(),
        },
      });

      return true;
    } catch (error) {
      console.error(
        `Error updating rating statistics for driver ${driverId}:`,
        error,
      );
      throw new InternalServerErrorException(
        'Failed to update driver rating statistics',
      );
    }
  }
}
