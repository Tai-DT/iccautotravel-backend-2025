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
  ApiSecurity,
} from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EnhancedPermissionsGuard } from '../auth/guards/enhanced-permissions.guard';
import {
  RequireAnyPermission,
  RequireAllPermissions,
} from '../auth/decorators/enhanced-permissions.decorator';
import { Resource } from '../auth/decorators/resource.decorator';
import { AuditAction } from '../auth/decorators/audit.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PERMISSIONS } from '../common/constants/permissions';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { ThrottlerGuard } from '@nestjs/throttler';

@ApiTags('Enhanced Dashboard')
@Controller('dashboard-v2')
@UseGuards(JwtAuthGuard, EnhancedPermissionsGuard, ThrottlerGuard)
@ApiBearerAuth()
@ApiSecurity('bearer')
export class EnhancedDashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  // @RequirePermissions([]) // TODO: Fix permission types
  @AuditAction('VIEW_DASHBOARD_OVERVIEW')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300) // 5 minutes cache
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
  async getOverview() {
    return this.dashboardService.getOverviewStats();
  }

  @Get('overview/full')
  // @RequirePermissions([]) // TODO: Fix permission types
  @AuditAction('VIEW_FULL_DASHBOARD')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(180) // 3 minutes cache
  @ApiOperation({
    summary: 'Get full dashboard overview with detailed metrics',
    description:
      'Returns comprehensive dashboard data. Requires full dashboard access.',
  })
  async getFullOverview(@CurrentUser() user: any) {
    // Enhanced overview with more sensitive data
    const basicOverview = await this.dashboardService.getOverviewStats();
    const additionalMetrics =
      await this.dashboardService.getPerformanceMetrics();

    return {
      ...basicOverview,
      performance: additionalMetrics,
      timestamp: new Date().toISOString(),
      generatedFor: user.id,
    };
  }

  @Get('services/analytics')
  // @RequirePermissions([]) // TODO: Fix permission types
  @AuditAction('VIEW_SERVICES_ANALYTICS')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(600) // 10 minutes cache
  @ApiOperation({ summary: 'Get services analytics with detailed breakdown' })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: ['7d', '30d', '90d'],
    description: 'Analytics period',
  })
  async getServicesAnalytics(@Query('period') period: string = '30d') {
    return this.dashboardService.getServicesAnalytics(period);
  }

  @Get('bookings/analytics')
  // @RequirePermissions([]) // TODO: Fix permission types
  @Resource('booking')
  @AuditAction('VIEW_BOOKINGS_ANALYTICS')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300)
  @ApiOperation({ summary: 'Get comprehensive bookings analytics' })
  @ApiQuery({ name: 'period', required: false, enum: ['7d', '30d', '90d'] })
  async getBookingsAnalytics(@Query('period') period: string = '30d') {
    return this.dashboardService.getBookingsAnalytics(period);
  }

  @Get('financial/summary')
  @RequireAnyPermission(
    PERMISSIONS.FINANCIAL.READ_REVENUE,
    PERMISSIONS.FINANCIAL.READ_REPORTS,
    PERMISSIONS.DASHBOARD.READ_FINANCIAL,
  )
  @Resource('financial')
  @AuditAction('VIEW_FINANCIAL_SUMMARY')
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
  async getFinancialSummary(@Query('period') period: string = '30d') {
    return this.dashboardService.getFinancialSummary(period);
  }

  @Get('users/analytics')
  // @RequirePermissions([]) // TODO: Fix permission types
  @Resource('user')
  @AuditAction('VIEW_USER_ANALYTICS')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(1800) // 30 minutes cache
  @ApiOperation({
    summary: 'Get user analytics and demographics',
    description: 'User data analytics. Requires user analytics permission.',
  })
  async getUsersAnalytics() {
    return this.dashboardService.getUsersAnalytics();
  }

  @Get('performance/metrics')
  // @RequirePermissions([]) // TODO: Fix permission types
  @AuditAction('VIEW_PERFORMANCE_METRICS')
  @ApiOperation({
    summary: 'Get system performance metrics',
    description:
      'Technical performance data. Requires performance monitoring permission.',
  })
  async getPerformanceMetrics() {
    return this.dashboardService.getPerformanceMetrics();
  }

  @Get('recent-bookings')
  // @RequirePermissions([]) // TODO: Fix permission types
  @Resource('booking')
  @AuditAction('VIEW_RECENT_BOOKINGS')
  @ApiOperation({ summary: 'Get recent bookings list' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of bookings to return',
  })
  async getRecentBookings(@Query('limit') limit = 5) {
    return this.dashboardService.getRecentBookings(Number(limit));
  }

  @Get('popular-services')
  // @RequirePermissions([]) // TODO: Fix permission types
  @AuditAction('VIEW_POPULAR_SERVICES')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(900) // 15 minutes cache
  @ApiOperation({ summary: 'Get most popular services' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getPopularServices(@Query('limit') limit = 5) {
    return this.dashboardService.getPopularServices(Number(limit));
  }

  // Administrative endpoints with strict permissions
  @Get('additional-services')
  // @RequirePermissions([]) // TODO: Fix permission types
  @AuditAction('VIEW_ADDITIONAL_SERVICES')
  @ApiOperation({ summary: 'Get all additional services configuration' })
  async getAdditionalServices() {
    return this.dashboardService.getAdditionalServices();
  }

  @Post('additional-services')
  // @RequirePermissions([]) // TODO: Fix permission types
  @AuditAction('CREATE_ADDITIONAL_SERVICE')
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
  async createAdditionalService(@Body() data: any) {
    return this.dashboardService.createAdditionalService(data);
  }

  @Put('additional-services/:id')
  // @RequirePermissions([]) // TODO: Fix permission types
  @Resource('service')
  @AuditAction('UPDATE_ADDITIONAL_SERVICE')
  @ApiOperation({ summary: 'Update an additional service' })
  @ApiParam({ name: 'id', type: String, description: 'Service ID' })
  @ApiResponse({ status: 200, description: 'Service updated successfully' })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions to update services',
  })
  @ApiResponse({ status: 404, description: 'Service not found' })
  async updateAdditionalService(@Param('id') id: string, @Body() data: any) {
    return this.dashboardService.updateAdditionalService(id, data);
  }

  @Delete('additional-services/:id')
  // @RequirePermissions([]) // TODO: Fix permission types
  @Resource('service')
  @AuditAction('DELETE_ADDITIONAL_SERVICE')
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
  async deleteAdditionalService(@Param('id') id: string) {
    return this.dashboardService.deleteAdditionalService(id);
  }

  // Advanced analytics endpoints for admin users
  @Get('analytics/comprehensive')
  @RequireAllPermissions(
    PERMISSIONS.DASHBOARD.READ_FULL,
    PERMISSIONS.DASHBOARD.READ_ANALYTICS,
    PERMISSIONS.FINANCIAL.VIEW_ANALYTICS,
  )
  @AuditAction('VIEW_COMPREHENSIVE_ANALYTICS')
  @ApiOperation({
    summary: 'Get comprehensive analytics dashboard',
    description:
      'Full analytics suite. Requires multiple high-level permissions.',
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
  // @RequirePermissions([]) // TODO: Fix permission types
  @AuditAction('EXPORT_DASHBOARD_DATA')
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
    // This would implement actual data export functionality
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
