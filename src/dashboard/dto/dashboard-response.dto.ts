import { ApiProperty } from '@nestjs/swagger';

export class DashboardOverviewDto {
  @ApiProperty()
  overview!: {
    totalServices: number;
    activeServices: number;
    totalBookings: number;
    totalUsers: number;
    totalDrivers: number;
    totalLocations: number;
    multilingualServices: number;
    comboServices: number;
    recentBookings: number;
  };

  @ApiProperty()
  serviceHealth!: {
    activePercentage: number;
    multilingualCoverage: number;
    comboPercentage: number;
  };

  @ApiProperty()
  businessMetrics!: {
    bookingGrowth: number;
    userGrowth: number;
    driverUtilization: number;
  };
}

export class ServicesAnalyticsDto {
  @ApiProperty()
  servicesByType!: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;

  @ApiProperty()
  seoMetrics!: {
    withSEO: number;
    total: number;
    coverage: number;
  };

  @ApiProperty()
  multilingualMetrics!: {
    languageStats: {
      vi: number;
      en: number;
      ko: number;
    };
    totalMultilingual: number;
    coverage: number;
  };
}
