import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ServiceType, PaymentStatus } from '@prisma/client';

export interface ServiceStats {
  type: ServiceType;
  total: number;
  active: number;
  revenue: number;
  bookings: number;
  averageRating: number;
  growth: number;
}

export interface DashboardOverview {
  totalServices: number;
  totalBookings: number;
  totalRevenue: number;
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  bookingGrowth: number;
  revenueGrowth: number;
}

export interface ServiceBreakdown {
  serviceStats: ServiceStats[];
  topPerformingServices: ServiceStats[];
  underPerformingServices: ServiceStats[];
}

export interface BookingAnalytics {
  totalBookings: number;
  confirmedBookings: number;
  pendingBookings: number;
  cancelledBookings: number;
  completedBookings: number;
  bookingsByService: Array<{
    serviceType: ServiceType;
    count: number;
    revenue: number;
  }>;
  recentBookings: Array<{
    id: string;
    bookingCode: string;
    serviceType: ServiceType;
    status: string;
    totalPrice: number;
    createdAt: Date;
    customerName: string;
  }>;
}

export interface RevenueAnalytics {
  totalRevenue: number;
  thisMonthRevenue: number;
  lastMonthRevenue: number;
  revenueByService: Array<{
    serviceType: ServiceType;
    revenue: number;
    percentage: number;
  }>;
  dailyRevenue: Array<{
    date: string;
    revenue: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    revenue: number;
    bookings: number;
  }>;
}

export interface UserAnalytics {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  usersByRole: Array<{
    role: string;
    count: number;
  }>;
  topCustomers: Array<{
    id: string;
    name: string;
    email: string;
    totalBookings: number;
    totalSpent: number;
  }>;
}

export interface VehicleAnalytics {
  totalVehicles: number;
  activeVehicles: number;
  vehicleTypes: Array<{
    type: string;
    count: number;
    utilization: number;
  }>;
  driverStats: {
    totalDrivers: number;
    activeDrivers: number;
    averageRating: number;
  };
  routeStats: {
    totalRoutes: number;
    popularRoutes: Array<{
      fromLocation: string;
      toLocation: string;
      bookingCount: number;
    }>;
  };
}

@Injectable()
export class DashboardEnhancedService {
  private readonly logger = new Logger(DashboardEnhancedService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getOverview(): Promise<DashboardOverview> {
    try {
      const now = new Date();
      const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        1,
      );
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

      const [
        totalServices,
        totalBookings,
        totalUsers,
        activeUsers,
        newUsersThisMonth,
        thisMonthBookings,
        lastMonthBookings,
        totalRevenue,
        thisMonthRevenue,
        lastMonthRevenue,
      ] = await Promise.all([
        this.prisma.service.count(),
        this.prisma.booking.count(),
        this.prisma.user.count(),
        this.prisma.user.count({ where: { isActive: true } }),
        this.prisma.user.count({
          where: { createdAt: { gte: startOfThisMonth } },
        }),
        this.prisma.booking.count({
          where: { createdAt: { gte: startOfThisMonth } },
        }),
        this.prisma.booking.count({
          where: {
            createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
          },
        }),
        this.prisma.payment
          .aggregate({
            _sum: { amount: true },
            where: { status: 'COMPLETED' },
          })
          .then((result) => result._sum.amount || 0),
        this.prisma.payment
          .aggregate({
            _sum: { amount: true },
            where: {
              status: 'COMPLETED',
              createdAt: { gte: startOfThisMonth },
            },
          })
          .then((result) => result._sum.amount || 0),
        this.prisma.payment
          .aggregate({
            _sum: { amount: true },
            where: {
              status: 'COMPLETED',
              createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
            },
          })
          .then((result) => result._sum.amount || 0),
      ]);

      const bookingGrowth =
        lastMonthBookings > 0
          ? ((thisMonthBookings - lastMonthBookings) / lastMonthBookings) * 100
          : 0;

      const revenueGrowth =
        Number(lastMonthRevenue) > 0
          ? ((Number(thisMonthRevenue) - Number(lastMonthRevenue)) /
              Number(lastMonthRevenue)) *
            100
          : 0;

      return {
        totalServices,
        totalBookings,
        totalRevenue: Number(totalRevenue),
        totalUsers,
        activeUsers,
        newUsersThisMonth,
        bookingGrowth: Math.round(bookingGrowth * 100) / 100,
        revenueGrowth: Math.round(revenueGrowth * 100) / 100,
      };
    } catch (error) {
      this.logger.error('Failed to get overview:', error);
      throw error;
    }
  }

  async getServiceBreakdown(): Promise<ServiceBreakdown> {
    try {
      const serviceTypes = Object.values(ServiceType);
      const serviceStats: ServiceStats[] = [];

      for (const serviceType of serviceTypes) {
        const [total, active, bookings] = await Promise.all([
          this.prisma.service.count({ where: { type: serviceType } }),
          this.prisma.service.count({
            where: { type: serviceType, isActive: true },
          }),
          this.prisma.bookingServices.count({
            where: { Service: { type: serviceType } },
          }),
        ]);

        // Get revenue for this service type
        const revenueResult = await this.prisma.payment.aggregate({
          _sum: { amount: true },
          where: {
            status: 'COMPLETED',
            Booking: {
              BookingServices: {
                some: { Service: { type: serviceType } },
              },
            },
          },
        });

        // Get average rating
        const ratingResult = await this.prisma.serviceReview.aggregate({
          _avg: { rating: true },
          where: { Service: { type: serviceType } },
        });

        // Calculate growth (comparing last 30 days vs previous 30 days)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

        const [recentBookings, previousBookings] = await Promise.all([
          this.prisma.bookingServices.count({
            where: {
              Service: { type: serviceType },
              Booking: { createdAt: { gte: thirtyDaysAgo } },
            },
          }),
          this.prisma.bookingServices.count({
            where: {
              Service: { type: serviceType },
              Booking: {
                createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
              },
            },
          }),
        ]);

        const growth =
          previousBookings > 0
            ? ((recentBookings - previousBookings) / previousBookings) * 100
            : 0;

        serviceStats.push({
          type: serviceType,
          total,
          active,
          revenue: Number(revenueResult._sum.amount) || 0,
          bookings,
          averageRating: Number(ratingResult._avg.rating) || 0,
          growth: Math.round(growth * 100) / 100,
        });
      }

      // Sort for top and under-performing services
      const topPerformingServices = [...serviceStats]
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      const underPerformingServices = [...serviceStats]
        .filter((s) => s.bookings > 0) // Only include services with bookings
        .sort((a, b) => a.growth - b.growth)
        .slice(0, 3);

      return {
        serviceStats,
        topPerformingServices,
        underPerformingServices,
      };
    } catch (error) {
      this.logger.error('Failed to get service breakdown:', error);
      throw error;
    }
  }

  async getBookingAnalytics(): Promise<BookingAnalytics> {
    try {
      const [
        totalBookings,
        confirmedBookings,
        pendingBookings,
        cancelledBookings,
        completedBookings,
      ] = await Promise.all([
        this.prisma.booking.count(),
        this.prisma.booking.count({ where: { status: 'CONFIRMED' } }),
        this.prisma.booking.count({ where: { status: 'PENDING' } }),
        this.prisma.booking.count({ where: { status: 'CANCELLED' } }),
        this.prisma.booking.count({ where: { status: 'COMPLETED' } }),
      ]);

      // Bookings by service type
      const serviceTypes = Object.values(ServiceType);
      const bookingsByService = [];

      for (const serviceType of serviceTypes) {
        const result = await this.prisma.bookingServices.count({
          where: { Service: { type: serviceType } },
        });

        const revenueResult = await this.prisma.payment.aggregate({
          _sum: { amount: true },
          where: {
            status: 'COMPLETED',
            Booking: {
              BookingServices: {
                some: { Service: { type: serviceType } },
              },
            },
          },
        });

        bookingsByService.push({
          serviceType,
          count: result,
          revenue: Number(revenueResult._sum.amount) || 0,
        });
      }

      // Recent bookings
      const recentBookingsData = await this.prisma.booking.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          User: { select: { fullName: true } },
          BookingServices: {
            include: { Service: { select: { type: true } } },
            take: 1,
          },
        },
      });

      const recentBookings = recentBookingsData.map((booking) => ({
        id: booking.id,
        bookingCode: booking.bookingCode || '',
        serviceType:
          booking.BookingServices[0]?.Service.type || ServiceType.BUS,
        status: booking.status,
        totalPrice: Number(booking.totalPrice),
        createdAt: booking.createdAt,
        customerName: booking.User.fullName,
      }));

      return {
        totalBookings,
        confirmedBookings,
        pendingBookings,
        cancelledBookings,
        completedBookings,
        bookingsByService,
        recentBookings,
      };
    } catch (error) {
      this.logger.error('Failed to get booking analytics:', error);
      throw error;
    }
  }

  async getRevenueAnalytics(): Promise<RevenueAnalytics> {
    try {
      const now = new Date();
      const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        1,
      );
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

      const [
        totalRevenueResult,
        thisMonthRevenueResult,
        lastMonthRevenueResult,
      ] = await Promise.all([
        this.prisma.payment.aggregate({
          _sum: { amount: true },
          where: { status: 'COMPLETED' },
        }),
        this.prisma.payment.aggregate({
          _sum: { amount: true },
          where: {
            status: 'COMPLETED',
            createdAt: { gte: startOfThisMonth },
          },
        }),
        this.prisma.payment.aggregate({
          _sum: { amount: true },
          where: {
            status: 'COMPLETED',
            createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
          },
        }),
      ]);

      const totalRevenue = Number(totalRevenueResult._sum.amount) || 0;
      const thisMonthRevenue = Number(thisMonthRevenueResult._sum.amount) || 0;
      const lastMonthRevenue = Number(lastMonthRevenueResult._sum.amount) || 0;

      // Revenue by service type
      const serviceTypes = Object.values(ServiceType);
      const revenueByService = [];

      for (const serviceType of serviceTypes) {
        const revenueResult = await this.prisma.payment.aggregate({
          _sum: { amount: true },
          where: {
            status: 'COMPLETED',
            Booking: {
              BookingServices: {
                some: { Service: { type: serviceType } },
              },
            },
          },
        });

        const revenue = Number(revenueResult._sum.amount) || 0;
        const percentage =
          totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0;

        revenueByService.push({
          serviceType,
          revenue,
          percentage: Math.round(percentage * 100) / 100,
        });
      }

      // Daily revenue for last 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const dailyRevenueData = await this.prisma.payment.groupBy({
        by: ['createdAt'],
        _sum: { amount: true },
        where: {
          status: 'COMPLETED',
          createdAt: { gte: thirtyDaysAgo },
        },
      });

      const dailyRevenue = dailyRevenueData.map((item) => ({
        date: item.createdAt.toISOString().split('T')[0],
        revenue: Number(item._sum.amount) || 0,
      }));

      // Monthly trends for last 12 months
      const monthlyTrends = [];
      for (let i = 11; i >= 0; i--) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

        const [revenueResult, bookingCount] = await Promise.all([
          this.prisma.payment.aggregate({
            _sum: { amount: true },
            where: {
              status: 'COMPLETED',
              createdAt: { gte: monthStart, lte: monthEnd },
            },
          }),
          this.prisma.booking.count({
            where: { createdAt: { gte: monthStart, lte: monthEnd } },
          }),
        ]);

        monthlyTrends.push({
          month: monthStart.toISOString().slice(0, 7), // YYYY-MM format
          revenue: Number(revenueResult._sum.amount) || 0,
          bookings: bookingCount,
        });
      }

      return {
        totalRevenue,
        thisMonthRevenue,
        lastMonthRevenue,
        revenueByService,
        dailyRevenue,
        monthlyTrends,
      };
    } catch (error) {
      this.logger.error('Failed to get revenue analytics:', error);
      throw error;
    }
  }

  async getUserAnalytics(): Promise<UserAnalytics> {
    try {
      const now = new Date();
      const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const [totalUsers, activeUsers, newUsers] = await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.count({ where: { isActive: true } }),
        this.prisma.user.count({
          where: { createdAt: { gte: startOfThisMonth } },
        }),
      ]);

      // Users by role
      const usersByRoleData = await this.prisma.user.groupBy({
        by: ['roleId'],
        _count: { id: true },
      });

      const usersByRole = await Promise.all(
        usersByRoleData.map(async (item) => {
          const role = await this.prisma.role.findUnique({
            where: { id: item.roleId },
            select: { name: true },
          });
          return {
            role: role?.name || 'Unknown',
            count: item._count.id,
          };
        }),
      );

      // Top customers
      const topCustomersData = await this.prisma.user.findMany({
        take: 10,
        include: {
          Booking: {
            select: {
              totalPrice: true,
              status: true,
            },
          },
        },
        where: {
          Role: { name: 'Customer' },
        },
      });

      const topCustomers = topCustomersData
        .map((user) => {
          const totalBookings = user.Booking.length;
          const totalSpent = user.Booking.reduce(
            (sum, booking) => sum + Number(booking.totalPrice),
            0,
          );
          return {
            id: user.id,
            name: user.fullName,
            email: user.email,
            totalBookings,
            totalSpent,
          };
        })
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, 10);

      return {
        totalUsers,
        activeUsers,
        newUsers,
        usersByRole,
        topCustomers,
      };
    } catch (error) {
      this.logger.error('Failed to get user analytics:', error);
      throw error;
    }
  }

  async getVehicleAnalytics(): Promise<VehicleAnalytics> {
    try {
      const [totalVehicles, activeVehicles] = await Promise.all([
        this.prisma.vehicleType.count(),
        this.prisma.vehicleType.count(),
      ]);

      // Vehicle types
      const vehicleTypesData = await this.prisma.vehicleType.findMany();

      const vehicleTypes = vehicleTypesData.map((vt) => ({
        type: vt.name,
        count: 0, // Placeholder - need to implement vehicle count logic
        utilization: Math.round(Math.random() * 100), // Placeholder - need real utilization logic
      }));

      // Driver stats
      const [totalDrivers, activeDrivers] = await Promise.all([
        this.prisma.user.count({
          where: { Role: { name: 'Driver' } },
        }),
        this.prisma.user.count({
          where: {
            Role: { name: 'Driver' },
            isActive: true,
          },
        }),
      ]);

      const averageRatingResult = await this.prisma.driverRating.aggregate({
        _avg: { averageRating: true },
      });

      // Route stats
      const [totalRoutes, popularRoutesData] = await Promise.all([
        this.prisma.vehicleRoute.count(),
        this.prisma.vehicleRoute.findMany({
          take: 5,
          include: {
            _count: {
              select: { VehicleSchedule: true },
            },
          },
          orderBy: {
            VehicleSchedule: {
              _count: 'desc',
            },
          },
        }),
      ]);

      const popularRoutes = popularRoutesData.map((route) => ({
        fromLocation: route.departureStation,
        toLocation: route.arrivalStation,
        bookingCount: route._count.VehicleSchedule,
      }));

      return {
        totalVehicles,
        activeVehicles,
        vehicleTypes,
        driverStats: {
          totalDrivers,
          activeDrivers,
          averageRating: Number(averageRatingResult._avg.averageRating) || 0,
        },
        routeStats: {
          totalRoutes,
          popularRoutes,
        },
      };
    } catch (error) {
      this.logger.error('Failed to get vehicle analytics:', error);
      throw error;
    }
  }

  async getSystemHealth() {
    try {
      const [dbHealth, serviceHealth, bookingHealth, userHealth] =
        await Promise.all([
          this.checkDatabaseHealth(),
          this.checkServiceHealth(),
          this.checkBookingHealth(),
          this.checkUserHealth(),
        ]);

      return {
        overall: 'healthy',
        components: {
          database: dbHealth,
          services: serviceHealth,
          bookings: bookingHealth,
          users: userHealth,
        },
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error('Failed to get system health:', error);
      throw error;
    }
  }

  private async checkDatabaseHealth() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'healthy', message: 'Database connection OK' };
    } catch (error) {
      return { status: 'unhealthy', message: 'Database connection failed' };
    }
  }

  private async checkServiceHealth() {
    try {
      const activeServices = await this.prisma.service.count({
        where: { isActive: true },
      });
      const totalServices = await this.prisma.service.count();

      const healthPercentage = (activeServices / totalServices) * 100;

      return {
        status: healthPercentage > 80 ? 'healthy' : 'warning',
        message: `${activeServices}/${totalServices} services active`,
        metrics: { activeServices, totalServices, healthPercentage },
      };
    } catch (error) {
      return { status: 'unhealthy', message: 'Service health check failed' };
    }
  }

  private async checkBookingHealth() {
    try {
      const recentFailures = await this.prisma.booking.count({
        where: {
          status: 'CANCELLED',
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
      });

      const totalRecent = await this.prisma.booking.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      });

      const failureRate =
        totalRecent > 0 ? (recentFailures / totalRecent) * 100 : 0;

      return {
        status: failureRate < 10 ? 'healthy' : 'warning',
        message: `${failureRate.toFixed(1)}% booking failure rate`,
        metrics: { recentFailures, totalRecent, failureRate },
      };
    } catch (error) {
      return { status: 'unhealthy', message: 'Booking health check failed' };
    }
  }

  private async checkUserHealth() {
    try {
      const activeUsers = await this.prisma.user.count({
        where: { isActive: true },
      });
      const totalUsers = await this.prisma.user.count();

      const activePercentage = (activeUsers / totalUsers) * 100;

      return {
        status: activePercentage > 70 ? 'healthy' : 'warning',
        message: `${activePercentage.toFixed(1)}% users active`,
        metrics: { activeUsers, totalUsers, activePercentage },
      };
    } catch (error) {
      return { status: 'unhealthy', message: 'User health check failed' };
    }
  }

  private async getTotalServicesMonthly(thirtyDaysAgo: Date): Promise<number> {
    return this.prisma.bookingServices.count({
      where: {
        Booking: { createdAt: { gte: thirtyDaysAgo } },
      },
    });
  }

  private async getActiveServicesCount(): Promise<number> {
    return this.prisma.bookingServices.count({
      where: {
        Booking: {
          paymentStatus: PaymentStatus.PAID,
          status: 'CONFIRMED',
        },
      },
    });
  }
}
