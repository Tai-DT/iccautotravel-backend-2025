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
  UseInterceptors,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiParam,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EnhancedPermissionsGuard } from '../auth/guards/enhanced-permissions-simple.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CacheInterceptor } from '@nestjs/cache-manager';

@ApiTags('Secure Dashboard')
@Controller('dashboard-secure')
@UseGuards(JwtAuthGuard, EnhancedPermissionsGuard)
@ApiBearerAuth()
export class SecureDashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  @Permissions('dashboard:read:basic')
  @UseInterceptors(CacheInterceptor)
  @ApiOperation({
    summary: 'Get dashboard overview statistics',
    description:
      'Returns basic dashboard metrics. Requires basic dashboard read permission.',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard overview data retrieved successfully',
  })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async getOverview(@CurrentUser() user: any) {
    return this.dashboardService.getOverviewStats();
  }

  @Get('overview/full')
  @Permissions('dashboard:read:full')
  @UseInterceptors(CacheInterceptor)
  @ApiOperation({
    summary: 'Get full dashboard overview with detailed metrics',
    description:
      'Returns comprehensive dashboard data. Requires full dashboard access.',
  })
  async getFullOverview(@CurrentUser() user: any) {
    const overview = await this.dashboardService.getOverviewStats();
    const performance = await this.dashboardService.getPerformanceMetrics();

    return {
      ...overview,
      performance,
      timestamp: new Date().toISOString(),
      generatedFor: user.id,
    };
  }

  @Get('services/analytics')
  @Permissions('services:view:analytics')
  @UseInterceptors(CacheInterceptor)
  @ApiOperation({ summary: 'Get services analytics with detailed breakdown' })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: ['7d', '30d', '90d'],
    description: 'Analytics period',
  })
  async getServicesAnalytics(
    @Query('period') period: string = '30d',
    @CurrentUser() user: any,
  ) {
    return this.dashboardService.getServicesAnalytics(period);
  }

  @Get('bookings/analytics')
  @Permissions('bookings:view:analytics')
  @UseInterceptors(CacheInterceptor)
  @ApiOperation({ summary: 'Get comprehensive bookings analytics' })
  @ApiQuery({ name: 'period', required: false, enum: ['7d', '30d', '90d'] })
  async getBookingsAnalytics(
    @Query('period') period: string = '30d',
    @CurrentUser() user: any,
  ) {
    return this.dashboardService.getBookingsAnalytics(period);
  }

  @Get('financial/summary')
  @Permissions('financial:read:revenue')
  @ApiOperation({
    summary: 'Get financial summary and revenue analytics',
    description:
      'Sensitive financial data. Requires financial read permissions.',
  })
  @ApiResponse({ status: 200, description: 'Financial summary retrieved' })
  @ApiResponse({
    status: 403,
    description: 'Insufficient financial permissions',
  })
  async getFinancialSummary(
    @Query('period') period: string = '30d',
    @CurrentUser() user: any,
  ) {
    return this.dashboardService.getFinancialSummary(period);
  }

  @Get('users/analytics')
  @Permissions('users:view:analytics')
  @UseInterceptors(CacheInterceptor)
  @ApiOperation({
    summary: 'Get user analytics and demographics',
    description: 'User data analytics. Requires user analytics permission.',
  })
  async getUsersAnalytics(@CurrentUser() user: any) {
    return this.dashboardService.getUsersAnalytics();
  }

  @Get('performance/metrics')
  @Permissions('dashboard:read:performance')
  @ApiOperation({
    summary: 'Get system performance metrics',
    description:
      'Technical performance data. Requires performance monitoring permission.',
  })
  async getPerformanceMetrics(@CurrentUser() user: any) {
    return this.dashboardService.getPerformanceMetrics();
  }

  @Get('recent-bookings')
  @Permissions('bookings:read:all')
  @ApiOperation({ summary: 'Get recent bookings list' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of bookings to return',
  })
  async getRecentBookings(@Query('limit') limit = 5, @CurrentUser() user: any) {
    return this.dashboardService.getRecentBookings(Number(limit));
  }

  @Get('popular-services')
  @Permissions('services:view:analytics')
  @UseInterceptors(CacheInterceptor)
  @ApiOperation({ summary: 'Get most popular services' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getPopularServices(
    @Query('limit') limit = 5,
    @CurrentUser() user: any,
  ) {
    return this.dashboardService.getPopularServices(Number(limit));
  }

  // Administrative endpoints with strict permissions
  @Get('additional-services')
  @Permissions('services:read')
  @ApiOperation({ summary: 'Get all additional services configuration' })
  async getAdditionalServices(@CurrentUser() user: any) {
    return this.dashboardService.getAdditionalServices();
  }

  @Post('additional-services')
  @Permissions('services:create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new additional service',
    description:
      'Create additional service. Requires service creation permission.',
  })
  @ApiResponse({
    status: 201,
    description: 'Additional service created successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions to create services',
  })
  async createAdditionalService(@Body() data: any, @CurrentUser() user: any) {
    return this.dashboardService.createAdditionalService(data);
  }

  @Put('additional-services/:id')
  @Permissions('services:update')
  @ApiOperation({ summary: 'Update an additional service' })
  @ApiParam({ name: 'id', type: String, description: 'Service ID' })
  @ApiResponse({ status: 200, description: 'Service updated successfully' })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions to update services',
  })
  @ApiResponse({ status: 404, description: 'Service not found' })
  async updateAdditionalService(
    @Param('id') id: string,
    @Body() data: any,
    @CurrentUser() user: any,
  ) {
    return this.dashboardService.updateAdditionalService(id, data);
  }

  @Delete('additional-services/:id')
  @Permissions('services:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete an additional service',
    description:
      'Permanently delete service. Requires service deletion permission.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Service ID to delete' })
  @ApiResponse({ status: 204, description: 'Service deleted successfully' })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions to delete services',
  })
  @ApiResponse({ status: 404, description: 'Service not found' })
  async deleteAdditionalService(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.dashboardService.deleteAdditionalService(id);
  }

  // Advanced analytics endpoints for admin users
  @Get('analytics/comprehensive')
  @Permissions('dashboard:read:analytics')
  @ApiOperation({
    summary: 'Get comprehensive analytics dashboard',
    description: 'Full analytics suite. Requires analytics permissions.',
  })
  async getComprehensiveAnalytics(@CurrentUser() user: any) {
    const [overview, services, bookings, financial, users, performance] =
      await Promise.all([
        this.dashboardService.getOverviewStats(),
        this.dashboardService.getServicesAnalytics('30d'),
        this.dashboardService.getBookingsAnalytics('30d'),
        this.dashboardService.getFinancialSummary('30d'),
        this.dashboardService.getUsersAnalytics(),
        this.dashboardService.getPerformanceMetrics(),
      ]);

    return {
      overview,
      services,
      bookings,
      financial,
      users,
      performance,
      generatedAt: new Date().toISOString(),
      generatedBy: user.id,
    };
  }

  @Get('export/data')
  @Permissions('financial:export:data')
  @ApiOperation({
    summary: 'Export dashboard data',
    description:
      'Export comprehensive dashboard data. Requires data export permission.',
  })
  @ApiQuery({
    name: 'format',
    required: false,
    enum: ['json', 'csv'],
    description: 'Export format',
  })
  async exportDashboardData(
    @Query('format') format: 'json' | 'csv' = 'json',
    @CurrentUser() user: any,
  ) {
    const data = await this.getComprehensiveAnalytics(user);

    return {
      data,
      exportedAt: new Date().toISOString(),
      exportedBy: user.id,
      format,
      // Add export processing logic here
    };
  }
}
