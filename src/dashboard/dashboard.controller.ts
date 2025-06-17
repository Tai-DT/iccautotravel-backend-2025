import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @ApiOperation({ summary: 'Get dashboard overview statistics' })
  @ApiResponse({ status: 200, description: 'Dashboard overview data' })
  async getOverview() {
    return this.dashboardService.getOverviewStats();
  }

  @Get('services/analytics')
  @ApiOperation({ summary: 'Get services analytics' })
  async getServicesAnalytics(@Query('period') period: string = '30d') {
    return this.dashboardService.getServicesAnalytics(period);
  }

  @Get('bookings/analytics')
  @ApiOperation({ summary: 'Get bookings analytics' })
  async getBookingsAnalytics(@Query('period') period: string = '30d') {
    return this.dashboardService.getBookingsAnalytics(period);
  }

  @Get('multilingual/stats')
  @ApiOperation({ summary: 'Get multilingual content statistics' })
  async getMultilingualStats() {
    return this.dashboardService.getMultilingualStats();
  }

  @Get('financial/summary')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get financial summary' })
  async getFinancialSummary(@Query('period') period: string = '30d') {
    return this.dashboardService.getFinancialSummary(period);
  }

  @Get('users/analytics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get users analytics' })
  async getUsersAnalytics() {
    return this.dashboardService.getUsersAnalytics();
  }

  @Get('performance/metrics')
  @ApiOperation({ summary: 'Get performance metrics' })
  async getPerformanceMetrics() {
    return this.dashboardService.getPerformanceMetrics();
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  async getDashboardStats() {
    return this.dashboardService.getDashboardStats();
  }

  @Get('recent-bookings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @ApiOperation({ summary: 'Get recent bookings' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getRecentBookings(@Query('limit') limit = 5) {
    return this.dashboardService.getRecentBookings(Number(limit));
  }

  @Get('popular-services')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @ApiOperation({ summary: 'Get popular services' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getPopularServices(@Query('limit') limit = 5) {
    return this.dashboardService.getPopularServices(Number(limit));
  }

  @Get('additional-services')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @ApiOperation({ summary: 'Get all additional services' })
  async getAdditionalServices() {
    return this.dashboardService.getAdditionalServices();
  }

  @Post('additional-services')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create an additional service' })
  async createAdditionalService(@Body() data: any) {
    return this.dashboardService.createAdditionalService(data);
  }

  @Put('additional-services/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update an additional service' })
  @ApiParam({ name: 'id', type: String })
  async updateAdditionalService(@Param('id') id: string, @Body() data: any) {
    return this.dashboardService.updateAdditionalService(id, data);
  }

  @Delete('additional-services/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete an additional service' })
  @ApiParam({ name: 'id', type: String })
  async deleteAdditionalService(@Param('id') id: string) {
    return this.dashboardService.deleteAdditionalService(id);
  }
}
