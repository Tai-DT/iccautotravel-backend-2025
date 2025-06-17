import { Resolver, Query, Args, Int } from '@nestjs/graphql';
import {
  MonthlyRevenueStats,
  DashboardStats,
  RecentBooking,
  PopularService,
  DailyBookingsStats,
  DriverStats,
  VehicleStats,
  ActivityFeed,
} from './dashboard.types';
import { DashboardService } from './dashboard.service';
import { UseGuards } from '@nestjs/common';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CustomJwtGuard } from '../auth/guards/custom-jwt.guard';

@Resolver()
export class DashboardResolver {
  constructor(private dashboardService: DashboardService) {}

  @Query(() => DashboardStats)
  @UseGuards(CustomJwtGuard, RolesGuard)
  @Roles('ADMIN')
  async getDashboardStats() {
    return this.dashboardService.getDashboardStats();
  }

  @Query(() => [RecentBooking])
  @UseGuards(CustomJwtGuard, RolesGuard)
  @Roles('ADMIN')
  async getRecentBookings(
    @Args('limit', { type: () => Int, defaultValue: 5 }) limit: number,
  ) {
    return this.dashboardService.getRecentBookings(limit);
  }

  @Query(() => [PopularService])
  @UseGuards(CustomJwtGuard, RolesGuard)
  @Roles('ADMIN')
  async getPopularServices(
    @Args('limit', { type: () => Int, defaultValue: 5 }) limit: number,
  ) {
    return this.dashboardService.getPopularServices(limit);
  }

  @Query(() => [MonthlyRevenueStats], { name: 'monthlyRevenue' })
  @UseGuards(CustomJwtGuard, RolesGuard)
  @Roles('ADMIN')
  async getMonthlyRevenue() {
    return this.dashboardService.getMonthlyRevenue();
  }

  @Query(() => [DailyBookingsStats], { name: 'dailyBookingsCount' })
  @UseGuards(CustomJwtGuard, RolesGuard)
  @Roles('ADMIN')
  async getDailyBookingsCount() {
    return this.dashboardService.getDailyBookingsCount();
  }

  @Query(() => DriverStats, { name: 'driverStats' })
  @UseGuards(CustomJwtGuard, RolesGuard)
  @Roles('ADMIN')
  async getDriverStats() {
    return this.dashboardService.getDriverStats();
  }

  @Query(() => VehicleStats, { name: 'vehicleStats' })
  @UseGuards(CustomJwtGuard, RolesGuard)
  @Roles('ADMIN')
  async getVehicleStats() {
    return this.dashboardService.getVehicleStats();
  }

  @Query(() => [ActivityFeed])
  @UseGuards(CustomJwtGuard, RolesGuard)
  @Roles('ADMIN')
  async getActivityFeed() {
    try {
      return await this.dashboardService.getActivityFeed();
    } catch (error) {
      console.error('Error in getActivityFeed resolver:', error);
      throw new Error('Không thể tải hoạt động gần đây. Vui lòng thử lại sau.');
    }
  }
}
