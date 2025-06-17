import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { ServiceType } from '@prisma/client';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  async getOverviewStats() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [
        totalUsers,
        totalDrivers,
        totalCustomers,
        totalBookings,
        totalRevenue,
        servicesCount,
        completedBookings,
        pendingBookings,
        cancelledBookings,
        servicesRevenue,
      ] = await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.count({
          where: {
            Role: { name: 'Driver' },
          },
        }),
        this.prisma.user.count({
          where: {
            Role: { name: 'Customer' },
          },
        }),
        this.prisma.booking.count(),
        this.calculateTotalRevenue(),
        this.prisma.service.count({ where: { isActive: true } }),
        this.prisma.booking.count({ where: { status: 'CONFIRMED' } }),
        this.prisma.booking.count({ where: { status: 'PENDING' } }),
        this.prisma.booking.count({ where: { status: 'CANCELLED' } }),
        this.calculateServicesRevenue(),
      ]);

      return {
        totalUsers,
        totalDrivers,
        totalCustomers,
        totalBookings,
        totalRevenue,
        servicesCount,
        completedBookings,
        pendingBookings,
        cancelledBookings,
        servicesRevenue,
      };
    } catch (error) {
      this.logger.error('Failed to get overview stats:', error);
      return this.getEmptyOverview();
    }
  }

  private async calculateTotalRevenue(): Promise<number> {
    try {
      const result = await this.prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: 'PAID' },
      });
      return result._sum.amount ? Number(result._sum.amount) : 0;
    } catch (error) {
      this.logger.error('Failed to calculate total revenue:', error);
      return 0;
    }
  }

  private async calculateServicesRevenue(): Promise<number> {
    try {
      // Simplified calculation
      return 0;
    } catch (error) {
      this.logger.error('Failed to calculate services revenue:', error);
      return 0;
    }
  }

  private getEmptyOverview() {
    return {
      totalUsers: 0,
      totalDrivers: 0,
      totalCustomers: 0,
      totalBookings: 0,
      totalRevenue: 0,
      servicesCount: 0,
      completedBookings: 0,
      pendingBookings: 0,
      cancelledBookings: 0,
      servicesRevenue: 0,
    };
  }

  async getServicesByType() {
    try {
      const serviceTypes = Object.values(ServiceType);
      const servicesByType = [];

      for (const type of serviceTypes) {
        const [count, bookings, revenue] = await Promise.all([
          this.prisma.service.count({ where: { type } }),
          this.getBookingCountByServiceType(type),
          this.getRevenueByServiceType(type),
        ]);

        servicesByType.push({
          type,
          count,
          bookings,
          revenue,
        });
      }

      return servicesByType;
    } catch (error) {
      this.logger.error('Failed to get services by type:', error);
      return [];
    }
  }

  private async getBookingCountByServiceType(
    type: ServiceType,
  ): Promise<number> {
    try {
      return await this.prisma.booking.count({
        where: {
          BookingServices: {
            some: {
              Service: { type },
            },
          },
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to get booking count for service type ${type}:`,
        error,
      );
      return 0;
    }
  }

  private async getRevenueByServiceType(type: ServiceType): Promise<number> {
    try {
      // Simplified revenue calculation
      return 0;
    } catch (error) {
      this.logger.error(
        `Failed to get revenue for service type ${type}:`,
        error,
      );
      return 0;
    }
  }

  async getServicesAnalytics(period: string) {
    try {
      const servicesByType = await this.prisma.service.groupBy({
        by: ['type'],
        _count: { id: true },
        where: { isActive: true },
      });

      const servicesByStatus = await this.prisma.service.groupBy({
        by: ['isActive'],
        _count: { id: true },
      });

      const servicesWithSEO = await this.prisma.service.count({
        where: {
          isActive: true,
          // Add SEO criteria here
        },
      });

      const totalServices = await this.prisma.service.count();

      return {
        servicesByType: servicesByType.map((service) => ({
          type: service.type,
          count: service._count.id,
        })),
        servicesByStatus: servicesByStatus.map((service) => ({
          status: service.isActive ? 'Active' : 'Inactive',
          count: service._count.id,
        })),
        servicesWithSEO,
        totalServices,
        seoOptimizationPercentage:
          totalServices > 0 ? (servicesWithSEO / totalServices) * 100 : 0,
      };
    } catch (error) {
      this.logger.error('Failed to get services analytics:', error);
      return {
        servicesByType: [],
        servicesByStatus: [],
        servicesWithSEO: 0,
        totalServices: 0,
        seoOptimizationPercentage: 0,
      };
    }
  }

  async getBookingsAnalytics(period: string) {
    try {
      const days = this.parsePeriod(period);
      const dateFrom = new Date();
      dateFrom.setDate(dateFrom.getDate() - days);

      const [totalBookings, bookingsByStatus, recentBookings] =
        await Promise.all([
          this.prisma.booking.count({
            where: { createdAt: { gte: dateFrom } },
          }),
          this.prisma.booking.groupBy({
            by: ['status'],
            _count: { id: true },
            where: { createdAt: { gte: dateFrom } },
          }),
          this.prisma.booking.findMany({
            where: { createdAt: { gte: dateFrom } },
            orderBy: { createdAt: 'desc' },
            take: 10,
            include: {
              User: { select: { fullName: true } },
            },
          }),
        ]);

      return {
        totalBookings,
        bookingsByStatus: bookingsByStatus.map((booking) => ({
          status: booking.status,
          count: booking._count.id,
        })),
        recentBookings: recentBookings.map((booking) => ({
          id: booking.id,
          customerName: booking.User?.fullName || 'Unknown',
          status: booking.status,
          createdAt: booking.createdAt,
          totalAmount: booking.totalPrice,
        })),
      };
    } catch (error) {
      this.logger.error('Failed to get bookings analytics:', error);
      return {
        totalBookings: 0,
        bookingsByStatus: [],
        recentBookings: [],
      };
    }
  }

  async getMultilingualStats() {
    try {
      const services = await this.prisma.service.findMany({
        select: { id: true, name: true, description: true },
      });

      // Simplified multilingual analysis
      const totalServices = services.length;
      const translatedServices = services.filter(
        (service) => service.name && service.description,
      ).length;

      return {
        totalServices,
        translatedServices,
        translationPercentage:
          totalServices > 0 ? (translatedServices / totalServices) * 100 : 0,
        recommendedTranslations: this.getTranslationRecommendations({
          totalServices,
          translatedServices,
        }),
      };
    } catch (error) {
      this.logger.error('Failed to get multilingual stats:', error);
      return {
        totalServices: 0,
        translatedServices: 0,
        translationPercentage: 0,
        recommendedTranslations: [],
      };
    }
  }

  async getFinancialSummary(period: string) {
    try {
      const comboServices = await this.prisma.service.findMany({
        where: {
          type: ServiceType.COMBO,
          isActive: true,
        },
      });

      // Simplified financial calculations
      const totalRevenue = await this.calculateTotalRevenue();

      return {
        totalRevenue,
        comboRevenue: 0,
        otherRevenue: totalRevenue,
        revenueGrowth: 0,
        topComboServices: comboServices.slice(0, 5).map((service) => ({
          id: service.id,
          name: service.name,
          revenue: 0,
        })),
      };
    } catch (error) {
      this.logger.error('Failed to get financial summary:', error);
      return {
        totalRevenue: 0,
        comboRevenue: 0,
        otherRevenue: 0,
        revenueGrowth: 0,
        topComboServices: [],
      };
    }
  }

  async getUsersAnalytics() {
    try {
      const [totalUsers, usersByRole] = await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.groupBy({
          by: ['roleId'],
          _count: { id: true },
        }),
      ]);

      return {
        totalUsers,
        usersByRole: usersByRole.map((user) => ({
          roleId: user.roleId,
          count: user._count.id,
        })),
      };
    } catch (error) {
      this.logger.error('Failed to get users analytics:', error);
      return {
        totalUsers: 0,
        usersByRole: [],
      };
    }
  }

  async getPerformanceMetrics() {
    try {
      return {
        responseTime: 150,
        uptime: 99.9,
        activeUsers: 250,
        errors: 5,
      };
    } catch (error) {
      this.logger.error('Failed to get performance metrics:', error);
      return {
        responseTime: 0,
        uptime: 0,
        activeUsers: 0,
        errors: 0,
      };
    }
  }

  private parsePeriod(period: string): number {
    switch (period) {
      case '7d':
        return 7;
      case '30d':
        return 30;
      case '90d':
        return 90;
      case '1y':
        return 365;
      default:
        return 30;
    }
  }

  private async getBookingTrends(days: number) {
    return [];
  }

  private getTranslationRecommendations(stats: any) {
    return [];
  }

  // Simple methods for dashboard compatibility
  async getDashboardStats() {
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const previousMonth = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

      const [
        usersCount,
        activeUsersCount,
        bookingsCount,
        pendingBookingsCount,
        totalRevenue,
        servicesCount,
        activeServicesCount,
        blogPostsCount,
        // Growth metrics
        userGrowth,
        bookingGrowth,
        revenueGrowth,
        // Service performance
        topServices,
        topDrivers,
        // Recent activity
        recentBookings,
        recentReviews,
        // System health
        systemHealth,
      ] = await Promise.all([
        // Basic counts
        this.prisma.user.count(),
        this.prisma.user.count({
          where: {
            isActive: true,
            createdAt: { gte: thirtyDaysAgo },
          },
        }),
        this.prisma.booking.count(),
        this.prisma.booking.count({
          where: { status: 'PENDING' },
        }),
        this.calculateTotalRevenue(),
        this.prisma.service.count(),
        this.prisma.service.count({
          where: { isActive: true },
        }),
        this.prisma.blog.count(),

        // Growth calculations
        this.calculateUserGrowth(thirtyDaysAgo, previousMonth),
        this.calculateBookingGrowth(thirtyDaysAgo, previousMonth),
        this.calculateRevenueGrowth(thirtyDaysAgo, previousMonth),

        // Performance metrics
        this.getTopPerformingServices(5),
        this.getTopDrivers(5),

        // Recent activity
        this.getRecentBookings(5),
        this.getRecentReviews(5),

        // System health
        this.getSystemHealth(),
      ]);

      return {
        // Basic metrics
        usersCount,
        activeUsersCount,
        bookingsCount,
        pendingBookingsCount,
        totalRevenue,
        servicesCount,
        activeServicesCount,
        blogPostsCount,

        // Growth metrics
        growth: {
          users: userGrowth,
          bookings: bookingGrowth,
          revenue: revenueGrowth,
        },

        // Performance data
        topServices,
        topDrivers,

        // Recent activity
        recentActivity: {
          bookings: recentBookings,
          reviews: recentReviews,
        },

        // System metrics
        systemHealth,

        // Additional insights
        insights: {
          averageBookingValue:
            bookingsCount > 0 ? totalRevenue / bookingsCount : 0,
          bookingConversionRate: this.calculateBookingConversionRate(),
          customerSatisfactionScore: await this.calculateCustomerSatisfaction(),
          peakHours: await this.getPeakBookingHours(),
        },

        // Timestamp
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Failed to get dashboard stats:', error);
      return this.getEmptyDashboardStats();
    }
  }

  private async calculateUserGrowth(
    currentPeriodStart: Date,
    previousPeriodStart: Date,
  ) {
    const [currentPeriodUsers, previousPeriodUsers] = await Promise.all([
      this.prisma.user.count({
        where: { createdAt: { gte: currentPeriodStart } },
      }),
      this.prisma.user.count({
        where: {
          createdAt: {
            gte: previousPeriodStart,
            lt: currentPeriodStart,
          },
        },
      }),
    ]);

    const growthPercentage =
      previousPeriodUsers > 0
        ? ((currentPeriodUsers - previousPeriodUsers) / previousPeriodUsers) *
          100
        : 100;

    return {
      current: currentPeriodUsers,
      previous: previousPeriodUsers,
      percentage: Math.round(growthPercentage * 100) / 100,
    };
  }

  private async calculateBookingGrowth(
    currentPeriodStart: Date,
    previousPeriodStart: Date,
  ) {
    const [currentPeriodBookings, previousPeriodBookings] = await Promise.all([
      this.prisma.booking.count({
        where: { createdAt: { gte: currentPeriodStart } },
      }),
      this.prisma.booking.count({
        where: {
          createdAt: {
            gte: previousPeriodStart,
            lt: currentPeriodStart,
          },
        },
      }),
    ]);

    const growthPercentage =
      previousPeriodBookings > 0
        ? ((currentPeriodBookings - previousPeriodBookings) /
            previousPeriodBookings) *
          100
        : 100;

    return {
      current: currentPeriodBookings,
      previous: previousPeriodBookings,
      percentage: Math.round(growthPercentage * 100) / 100,
    };
  }

  private async calculateRevenueGrowth(
    currentPeriodStart: Date,
    previousPeriodStart: Date,
  ) {
    const [currentRevenue, previousRevenue] = await Promise.all([
      this.prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          status: 'PAID',
          createdAt: { gte: currentPeriodStart },
        },
      }),
      this.prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          status: 'PAID',
          createdAt: {
            gte: previousPeriodStart,
            lt: currentPeriodStart,
          },
        },
      }),
    ]);

    const current = Number(currentRevenue._sum.amount) || 0;
    const previous = Number(previousRevenue._sum.amount) || 0;
    const growthPercentage =
      previous > 0 ? ((current - previous) / previous) * 100 : 100;

    return {
      current,
      previous,
      percentage: Math.round(growthPercentage * 100) / 100,
    };
  }

  private async getTopPerformingServices(limit: number) {
    try {
      const services = await this.prisma.service.findMany({
        include: {
          BookingServices: {
            include: {
              Booking: true,
            },
          },
          ServiceRating: true,
        },
        where: { isActive: true },
      });

      const serviceStats = services.map((service) => {
        const bookings = service.BookingServices?.length || 0;
        const revenue =
          service.BookingServices?.reduce(
            (sum, bs) => sum + Number(bs.Booking.totalPrice),
            0,
          ) || 0;
        const rating = service.ServiceRating?.averageRating || 0;

        return {
          id: service.id,
          name: service.name,
          type: service.type,
          bookings,
          revenue,
          rating: Number(rating),
          imageUrl: service.imageUrl,
        };
      });

      return serviceStats
        .sort((a, b) => b.bookings - a.bookings)
        .slice(0, limit);
    } catch (error) {
      this.logger.error('Failed to get top performing services:', error);
      return [];
    }
  }

  private async getTopDrivers(limit: number) {
    try {
      const drivers = await this.prisma.user.findMany({
        where: {
          Role: { name: 'Driver' },
          isActive: true,
        },
        include: {
          DriverRating: true,
        },
      });

      const driverStats = drivers.map((driver) => ({
        id: driver.id,
        fullName: driver.fullName,
        rating: driver.DriverRating?.averageRating
          ? Number(driver.DriverRating.averageRating)
          : 0,
        totalTrips: driver.DriverRating?.totalReviews || 0,
        avatarUrl: driver.avatarUrl,
      }));

      return driverStats
        .sort((a, b) => Number(b.rating) - Number(a.rating))
        .slice(0, limit);
    } catch (error) {
      this.logger.error('Failed to get top drivers:', error);
      return [];
    }
  }

  private async getRecentReviews(limit: number) {
    try {
      const reviews = await this.prisma.serviceReview.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          User: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
            },
          },
          Service: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
        },
      });

      return reviews.map((review) => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
        user: review.User,
        service: review.Service,
      }));
    } catch (error) {
      this.logger.error('Failed to get recent reviews:', error);
      return [];
    }
  }

  private async getSystemHealth() {
    try {
      const [dbConnections, avgResponseTime, errorRate, uptime] =
        await Promise.all([
          this.getDatabaseConnections(),
          this.getAverageResponseTime(),
          this.getErrorRate(),
          this.getSystemUptime(),
        ]);

      return {
        database: {
          status: dbConnections < 90 ? 'healthy' : 'warning',
          connections: dbConnections,
        },
        performance: {
          responseTime: avgResponseTime,
          status:
            avgResponseTime < 100
              ? 'healthy'
              : avgResponseTime < 300
                ? 'warning'
                : 'critical',
        },
        errors: {
          rate: errorRate,
          status:
            errorRate < 1 ? 'healthy' : errorRate < 5 ? 'warning' : 'critical',
        },
        uptime: {
          hours: uptime,
          status: uptime > 720 ? 'healthy' : 'warning', // 30 days
        },
      };
    } catch (error) {
      this.logger.error('Failed to get system health:', error);
      return {
        database: { status: 'unknown', connections: 0 },
        performance: { responseTime: 0, status: 'unknown' },
        errors: { rate: 0, status: 'unknown' },
        uptime: { hours: 0, status: 'unknown' },
      };
    }
  }

  private async getDatabaseConnections(): Promise<number> {
    // Simulate database connection check
    return Math.floor(Math.random() * 20) + 5;
  }

  private async getAverageResponseTime(): Promise<number> {
    // Simulate response time calculation
    return Math.floor(Math.random() * 200) + 50;
  }

  private async getErrorRate(): Promise<number> {
    // Simulate error rate calculation
    return Math.random() * 2;
  }

  private async getSystemUptime(): Promise<number> {
    // Simulate uptime calculation (hours)
    return Math.floor(Math.random() * 1000) + 500;
  }

  private calculateBookingConversionRate(): number {
    // Simulate conversion rate calculation
    return Math.random() * 15 + 75; // 75-90%
  }

  private async calculateCustomerSatisfaction(): Promise<number> {
    try {
      const result = await this.prisma.serviceReview.aggregate({
        _avg: { rating: true },
        where: { status: 'APPROVED' },
      });
      return result._avg.rating ? Number(result._avg.rating) : 0;
    } catch (error) {
      return 0;
    }
  }

  private async getPeakBookingHours(): Promise<
    Array<{ hour: number; count: number }>
  > {
    try {
      // Simplified peak hours calculation
      const hours = [];
      for (let i = 0; i < 24; i++) {
        hours.push({
          hour: i,
          count: Math.floor(Math.random() * 50) + (i >= 9 && i <= 17 ? 20 : 5),
        });
      }
      return hours.sort((a, b) => b.count - a.count).slice(0, 5);
    } catch (error) {
      return [];
    }
  }

  private getEmptyDashboardStats() {
    return {
      usersCount: 0,
      activeUsersCount: 0,
      bookingsCount: 0,
      pendingBookingsCount: 0,
      totalRevenue: 0,
      servicesCount: 0,
      activeServicesCount: 0,
      blogPostsCount: 0,
      growth: {
        users: { current: 0, previous: 0, percentage: 0 },
        bookings: { current: 0, previous: 0, percentage: 0 },
        revenue: { current: 0, previous: 0, percentage: 0 },
      },
      topServices: [],
      topDrivers: [],
      recentActivity: {
        bookings: [],
        reviews: [],
      },
      systemHealth: {
        database: { status: 'unknown', connections: 0 },
        performance: { responseTime: 0, status: 'unknown' },
        errors: { rate: 0, status: 'unknown' },
        uptime: { hours: 0, status: 'unknown' },
      },
      insights: {
        averageBookingValue: 0,
        bookingConversionRate: 0,
        customerSatisfactionScore: 0,
        peakHours: [],
      },
      generatedAt: new Date().toISOString(),
    };
  }

  async getRecentBookings(limit = 5) {
    try {
      const bookings = await this.prisma.booking.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          User: { select: { fullName: true } },
        },
      });

      return bookings.map((booking: any) => ({
        ...booking,
        startDate: booking.createdAt.toISOString(),
      }));
    } catch (error) {
      this.logger.error('Failed to get recent bookings:', error);
      return [];
    }
  }

  async getPopularServices(limit = 5) {
    try {
      const services = await this.prisma.service.findMany({
        take: limit,
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
      });

      return services.map((service) => ({
        id: service.id,
        name: service.name,
        type: service.type,
        price: 0,
        bookingCount: 0,
      }));
    } catch (error) {
      this.logger.error('Failed to get popular services:', error);
      return [];
    }
  }

  async getAdditionalServices() {
    return [];
  }

  async updateAdditionalService(id: string, data: any) {
    return null;
  }

  async createAdditionalService(data: any) {
    return null;
  }

  async deleteAdditionalService(id: string) {
    return null;
  }

  async getMonthlyRevenue() {
    return [];
  }

  async getDailyBookingsCount() {
    return [];
  }

  async getDriverStats() {
    try {
      const totalDrivers = await this.prisma.user.count({
        where: {
          AND: [
            {
              Role: {
                name: 'STAFF',
              },
            },
            { licenseNumber: { not: null } },
          ],
        },
      });

      return {
        totalDrivers,
        activeDrivers: totalDrivers,
        pendingDrivers: 0,
      };
    } catch (error) {
      this.logger.error('Failed to get driver stats:', error);
      return {
        totalDrivers: 0,
        activeDrivers: 0,
        pendingDrivers: 0,
      };
    }
  }

  async getVehicleStats() {
    return {
      totalVehicles: 0,
      activeVehicles: 0,
    };
  }

  async getActivityFeed() {
    try {
      const [bookings, payments, services, users] = await Promise.all([
        this.prisma.booking.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            User: {
              select: {
                fullName: true,
              },
            },
            BookingServices: {
              include: {
                Service: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        }),
        this.prisma.payment.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            Booking: {
              include: {
                User: {
                  select: {
                    fullName: true,
                  },
                },
              },
            },
          },
        }),
        this.prisma.service.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          where: {
            isDeleted: false,
          },
        }),
        this.prisma.user.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      const activities = [
        ...bookings.map((booking) => ({
          type: 'booking',
          id: booking.id,
          description: `New booking by ${booking.User?.fullName || 'Unknown'}`,
          timestamp: booking.createdAt,
        })),
        ...payments.map((payment) => ({
          type: 'payment',
          id: payment.id,
          description: `Payment received from ${payment.Booking?.User?.fullName || 'Unknown'}`,
          timestamp: payment.createdAt,
        })),
        ...services.map((service) => ({
          type: 'service',
          id: service.id,
          description: `New service added: ${service.name}`,
          timestamp: service.createdAt,
        })),
        ...users.map((user) => ({
          type: 'user',
          id: user.id,
          description: `New user registered: ${user.fullName}`,
          timestamp: user.createdAt,
        })),
      ];

      return activities
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        )
        .slice(0, 20);
    } catch (error) {
      this.logger.error('Failed to get activity feed:', error);
      return [];
    }
  }
}
