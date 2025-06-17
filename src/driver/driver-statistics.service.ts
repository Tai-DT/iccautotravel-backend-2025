import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class DriverStatisticsService {
  constructor(private prisma: PrismaService) {}

  async getDriverStatistics(driverId: string) {
    // Using raw query instead of model access
    const result = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM "DriverStatistics" WHERE "driverId" = ${driverId}
    `;
    return result.length > 0 ? result[0] : null;
  }

  async updateDriverStatistics(driverId: string, data: any) {
    // Use upsert with raw query instead
    const stats = await this.prisma.$queryRaw<any[]>`
      SELECT id FROM "DriverStatistics" WHERE "driverId" = ${driverId}
    `;

    if (stats && stats.length > 0) {
      // Update existing record
      const setClause = Object.entries(data)
        .map(([key, value]) => {
          if (value === null) return `"${key}" = NULL`;
          if (typeof value === 'string') return `"${key}" = '${value}'`;
          return `"${key}" = ${value}`;
        })
        .join(', ');

      await this.prisma.$executeRaw`
        UPDATE "DriverStatistics" SET ${Prisma.raw(setClause)}, "updatedAt" = NOW() WHERE "driverId" = ${driverId}
      `;
    } else {
      // Insert new record
      const id = `stats_${Math.random().toString(36).substr(2, 9)}`;
      const columnsWithDefaults = [
        'id',
        'driverId',
        ...Object.keys(data),
        'updatedAt',
      ];
      const valuesWithDefaults = [`'${id}'`, `'${driverId}'`];

      // Add data values
      for (const value of Object.values(data)) {
        if (value === null) {
          valuesWithDefaults.push('NULL');
        } else if (typeof value === 'string') {
          valuesWithDefaults.push(`'${value}'`);
        } else if (value instanceof Date) {
          valuesWithDefaults.push(`'${value.toISOString()}'`);
        } else {
          valuesWithDefaults.push(`${value}`);
        }
      }

      // Add updatedAt
      valuesWithDefaults.push('NOW()');

      await this.prisma.$executeRaw`
        INSERT INTO "DriverStatistics" (${Prisma.raw(columnsWithDefaults.map((c) => `"${c}"`).join(', '))})
        VALUES (${Prisma.raw(valuesWithDefaults.join(', '))})
      `;
    }
  }

  // Generate performance report for a driver
  async generatePerformanceReport(
    driverId: string,
    startDate: Date,
    endDate: Date,
  ) {
    // Get driver statistics
    const stats = await this.getDriverStatistics(driverId);

    // Get completed bookings in date range
    const bookings = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM "Booking" 
      WHERE "assignedDriverId" = ${driverId}
      AND "status" = 'COMPLETED'
      AND "createdAt" >= ${startDate.toISOString()}
      AND "createdAt" <= ${endDate.toISOString()}
    `;

    // Get reviews in date range
    const reviews = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM "DriverReview" 
      WHERE "driverId" = ${driverId}
      AND "createdAt" >= ${startDate.toISOString()}
      AND "createdAt" <= ${endDate.toISOString()}
    `;

    // Calculate average rating for the period
    let periodRating = 0;
    if (reviews.length > 0) {
      const totalRating = reviews.reduce(
        (sum, review) => sum + review.rating,
        0,
      );
      periodRating = totalRating / reviews.length;
    }

    return {
      driverId,
      period: {
        start: startDate,
        end: endDate,
      },
      statistics: stats,
      completedTrips: bookings.length,
      newReviews: reviews.length,
      periodRating,
      bookings: bookings,
    };
  }

  // Get top drivers by rating
  async getDriverRankings(limit = 10) {
    const drivers = await this.prisma.$queryRaw<any[]>`
      SELECT d.id, d."userId", dr."averageRating", ds."totalTrips", ds."totalEarnings"
      FROM "Driver" d
      LEFT JOIN "DriverRating" dr ON d.id = dr."driverId"
      LEFT JOIN "DriverStatistics" ds ON d.id = ds."driverId"
      WHERE d."isActive" = true AND d."status" = 'APPROVED'
      ORDER BY dr."averageRating" DESC NULLS LAST, ds."totalTrips" DESC NULLS LAST
      LIMIT ${limit}
    `;

    return drivers;
  }
}
