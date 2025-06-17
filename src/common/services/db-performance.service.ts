import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { Cron, CronExpression } from '@nestjs/schedule';

interface QueryMetrics {
  query: string;
  count: number;
  totalTime: number;
  avgTime: number;
  maxTime: number;
  slowCount: number;
  errorCount: number;
  lastExecuted: number;
}

@Injectable()
export class DatabasePerformanceService implements OnModuleInit {
  private readonly logger = new Logger('DatabasePerformance');
  private queryMetrics = new Map<string, QueryMetrics>();

  constructor(
    private readonly prismaService: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  async onModuleInit() {
    this.setupQueryMonitoring();
    await this.loadExistingMetrics();
    this.logger.log('Database performance monitoring initialized');
  }

  private setupQueryMonitoring(): void {
    this.prismaService.$use(async (params, next) => {
      const startTime = Date.now();
      const queryKey = `${params.model || 'raw'}.${params.action || 'query'}`;

      try {
        const result = await next(params);
        const duration = Date.now() - startTime;
        await this.recordQuery(queryKey, duration, true);
        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        await this.recordQuery(queryKey, duration, false);
        throw error;
      }
    });
  }

  private async recordQuery(
    queryKey: string,
    duration: number,
    success: boolean,
  ): Promise<void> {
    const metrics = this.queryMetrics.get(queryKey) || {
      query: queryKey,
      count: 0,
      totalTime: 0,
      avgTime: 0,
      maxTime: 0,
      slowCount: 0,
      errorCount: 0,
      lastExecuted: Date.now(),
    };

    metrics.count++;
    metrics.totalTime += duration;
    metrics.avgTime = metrics.totalTime / metrics.count;
    metrics.maxTime = Math.max(metrics.maxTime, duration);
    metrics.lastExecuted = Date.now();

    if (duration > 1000) {
      metrics.slowCount++;
      this.logger.warn(`Slow query: ${queryKey} took ${duration}ms`);
    }

    if (!success) {
      metrics.errorCount++;
    }

    this.queryMetrics.set(queryKey, metrics);

    if (metrics.count % 25 === 0) {
      await this.saveMetrics();
    }
  }

  private async saveMetrics(): Promise<void> {
    try {
      const metricsArray = Array.from(this.queryMetrics.values());
      await this.redisService.setJson(
        'db:performance:metrics',
        metricsArray,
        3600,
      );
    } catch (error) {
      this.logger.error('Error saving metrics:', error);
    }
  }

  private async loadExistingMetrics(): Promise<void> {
    try {
      const metrics = await this.redisService.getJson<QueryMetrics[]>(
        'db:performance:metrics',
      );
      if (metrics) {
        metrics.forEach((metric) => {
          this.queryMetrics.set(metric.query, metric);
        });
        this.logger.log(`Loaded ${metrics.length} query metrics`);
      }
    } catch (error) {
      this.logger.error('Error loading metrics:', error);
    }
  }

  async getPerformanceReport(): Promise<{
    status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
    totalQueries: number;
    slowQueries: number;
    avgResponseTime: number;
    errorRate: number;
    topSlowQueries: QueryMetrics[];
    recommendations: string[];
  }> {
    const metrics = Array.from(this.queryMetrics.values());
    const totalQueries = metrics.reduce((sum, m) => sum + m.count, 0);
    const slowQueries = metrics.reduce((sum, m) => sum + m.slowCount, 0);
    const errorQueries = metrics.reduce((sum, m) => sum + m.errorCount, 0);
    const avgResponseTime =
      metrics.length > 0
        ? metrics.reduce((sum, m) => sum + m.avgTime, 0) / metrics.length
        : 0;

    const slowQueryRate =
      totalQueries > 0 ? (slowQueries / totalQueries) * 100 : 0;
    const errorRate =
      totalQueries > 0 ? (errorQueries / totalQueries) * 100 : 0;

    let status: 'HEALTHY' | 'WARNING' | 'CRITICAL' = 'HEALTHY';
    const recommendations: string[] = [];

    if (errorRate > 5 || slowQueryRate > 15) {
      status = 'CRITICAL';
      recommendations.push(
        'Immediate attention required for database performance',
      );
    } else if (errorRate > 1 || slowQueryRate > 8 || avgResponseTime > 500) {
      status = 'WARNING';
      recommendations.push('Consider optimizing slow queries');
    }

    if (slowQueryRate > 5) {
      recommendations.push('Add database indexes for frequently used queries');
    }

    const topSlowQueries = metrics
      .filter((m) => m.slowCount > 0)
      .sort((a, b) => b.avgTime - a.avgTime)
      .slice(0, 5);

    return {
      status,
      totalQueries,
      slowQueries,
      avgResponseTime: Math.round(avgResponseTime * 100) / 100,
      errorRate: Math.round(errorRate * 100) / 100,
      topSlowQueries,
      recommendations,
    };
  }

  async getIndexRecommendations(): Promise<
    Array<{
      table: string;
      columns: string[];
      reason: string;
      sql: string;
    }>
  > {
    return [
      {
        table: 'bookings',
        columns: ['user_id', 'created_at'],
        reason: 'Optimize user booking queries',
        sql: 'CREATE INDEX idx_bookings_user_created ON bookings(user_id, created_at);',
      },
      {
        table: 'services',
        columns: ['type', 'location_id'],
        reason: 'Improve service search performance',
        sql: 'CREATE INDEX idx_services_type_location ON services(type, location_id);',
      },
    ];
  }

  @Cron(CronExpression.EVERY_HOUR)
  async performanceCheck(): Promise<void> {
    try {
      const report = await this.getPerformanceReport();

      if (report.status === 'CRITICAL') {
        this.logger.error(
          `Database performance CRITICAL - Error rate: ${report.errorRate}%, Slow queries: ${report.slowQueries}`,
        );
      } else if (report.status === 'WARNING') {
        this.logger.warn(
          `Database performance WARNING - Avg response: ${report.avgResponseTime}ms`,
        );
      }

      await this.redisService.setJson(
        'db:performance:latest',
        {
          ...report,
          timestamp: Date.now(),
        },
        3600,
      );
    } catch (error) {
      this.logger.error('Error in performance check:', error);
    }
  }

  async optimizeDatabase(): Promise<{ message: string; optimized: number }> {
    try {
      // Clean old metrics
      const cutoff = Date.now() - 24 * 60 * 60 * 1000;
      let cleaned = 0;

      for (const [key, metrics] of this.queryMetrics.entries()) {
        if (metrics.lastExecuted < cutoff) {
          this.queryMetrics.delete(key);
          cleaned++;
        }
      }

      await this.saveMetrics();

      // Update database statistics
      try {
        await this.prismaService.$executeRaw`ANALYZE;`;
      } catch (error) {
        this.logger.warn(
          'Could not run ANALYZE:',
          error instanceof Error ? error.message : String(error),
        );
      }

      return {
        message: 'Database optimization completed',
        optimized: cleaned,
      };
    } catch (error) {
      this.logger.error('Error optimizing database:', error);
      throw error;
    }
  }
}
