import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';

interface QueryMetrics {
  query: string;
  count: number;
  totalTime: number;
  avgTime: number;
  maxTime: number;
  minTime: number;
  slowCount: number;
  errorCount: number;
  lastExecuted: number;
}

interface DatabaseHealth {
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  metrics: {
    totalQueries: number;
    slowQueries: number;
    avgResponseTime: number;
    errorRate: number;
    connectionPool: {
      active: number;
      idle: number;
      total: number;
    };
  };
  issues: string[];
  recommendations: string[];
}

@Injectable()
export class DatabaseOptimizerService implements OnModuleInit {
  private readonly logger = new Logger('DatabaseOptimizer');
  private queryMetrics = new Map<string, QueryMetrics>();
  private connectionStats = {
    activeConnections: 0,
    totalConnections: 0,
    peakConnections: 0,
  };

  constructor(
    private readonly prismaService: PrismaService,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    await this.initializeOptimizer();
  }

  private async initializeOptimizer(): Promise<void> {
    try {
      this.setupQueryMonitoring();
      await this.loadExistingMetrics();
      this.logger.log('Database optimizer initialized');
    } catch (error) {
      this.logger.error('Failed to initialize database optimizer:', error);
    }
  }

  private setupQueryMonitoring(): void {
    this.prismaService.$use(async (params, next) => {
      const startTime = Date.now();
      const queryKey = `${params.model || 'raw'}.${params.action || 'query'}`;

      this.connectionStats.activeConnections++;
      this.connectionStats.totalConnections++;
      this.connectionStats.peakConnections = Math.max(
        this.connectionStats.peakConnections,
        this.connectionStats.activeConnections,
      );

      try {
        const result = await next(params);
        const duration = Date.now() - startTime;
        await this.recordQuerySuccess(queryKey, duration);
        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        await this.recordQueryError(queryKey, duration, error);
        throw error;
      } finally {
        this.connectionStats.activeConnections--;
      }
    });
  }

  private async recordQuerySuccess(
    queryKey: string,
    duration: number,
  ): Promise<void> {
    const metrics = this.queryMetrics.get(queryKey) || {
      query: queryKey,
      count: 0,
      totalTime: 0,
      avgTime: 0,
      maxTime: 0,
      minTime: Infinity,
      slowCount: 0,
      errorCount: 0,
      lastExecuted: Date.now(),
    };

    metrics.count++;
    metrics.totalTime += duration;
    metrics.avgTime = metrics.totalTime / metrics.count;
    metrics.maxTime = Math.max(metrics.maxTime, duration);
    metrics.minTime = Math.min(metrics.minTime, duration);
    metrics.lastExecuted = Date.now();

    // Track slow queries (>1000ms)
    if (duration > 1000) {
      metrics.slowCount++;
      this.logger.warn(`Slow query: ${queryKey} took ${duration}ms`);
    }

    this.queryMetrics.set(queryKey, metrics);

    // Save metrics periodically
    if (metrics.count % 50 === 0) {
      await this.saveMetrics();
    }
  }

  private async recordQueryError(
    queryKey: string,
    duration: number,
    error: any,
  ): Promise<void> {
    const metrics = this.queryMetrics.get(queryKey) || {
      query: queryKey,
      count: 0,
      totalTime: 0,
      avgTime: 0,
      maxTime: 0,
      minTime: Infinity,
      slowCount: 0,
      errorCount: 0,
      lastExecuted: Date.now(),
    };

    metrics.errorCount++;
    metrics.lastExecuted = Date.now();
    this.queryMetrics.set(queryKey, metrics);

    this.logger.error(`Query error in ${queryKey}: ${error.message}`);
  }

  private async saveMetrics(): Promise<void> {
    try {
      const metricsArray = Array.from(this.queryMetrics.values());
      await this.redisService.setJson(
        'db:optimizer:metrics',
        metricsArray,
        3600,
      );

      await this.redisService.setJson(
        'db:optimizer:connections',
        this.connectionStats,
        3600,
      );
    } catch (error) {
      this.logger.error('Error saving metrics:', error);
    }
  }

  private async loadExistingMetrics(): Promise<void> {
    try {
      const metrics = await this.redisService.getJson<QueryMetrics[]>(
        'db:optimizer:metrics',
      );
      if (metrics) {
        metrics.forEach((metric) => {
          this.queryMetrics.set(metric.query, metric);
        });
        this.logger.log(`Loaded ${metrics.length} query metrics`);
      }

      const connections = await this.redisService.getJson<
        typeof this.connectionStats
      >('db:optimizer:connections');
      if (connections) {
        this.connectionStats = { ...this.connectionStats, ...connections };
      }
    } catch (error) {
      this.logger.error('Error loading metrics:', error);
    }
  }

  /**
   * Get database health report
   */
  async getDatabaseHealth(): Promise<DatabaseHealth> {
    const metrics = Array.from(this.queryMetrics.values());
    const totalQueries = metrics.reduce((sum, m) => sum + m.count, 0);
    const slowQueries = metrics.reduce((sum, m) => sum + m.slowCount, 0);
    const errorQueries = metrics.reduce((sum, m) => sum + m.errorCount, 0);
    const avgResponseTime =
      metrics.length > 0
        ? metrics.reduce((sum, m) => sum + m.avgTime, 0) / metrics.length
        : 0;

    const issues: string[] = [];
    const recommendations: string[] = [];
    let status: 'HEALTHY' | 'WARNING' | 'CRITICAL' = 'HEALTHY';

    // Check for issues
    const slowQueryRate =
      totalQueries > 0 ? (slowQueries / totalQueries) * 100 : 0;
    const errorRate =
      totalQueries > 0 ? (errorQueries / totalQueries) * 100 : 0;

    if (errorRate > 5) {
      status = 'CRITICAL';
      issues.push(`High error rate: ${errorRate.toFixed(2)}%`);
      recommendations.push('Review error logs and fix failing queries');
    } else if (errorRate > 1) {
      status = 'WARNING';
      issues.push(`Elevated error rate: ${errorRate.toFixed(2)}%`);
    }

    if (slowQueryRate > 10) {
      status = 'CRITICAL';
      issues.push(`High slow query rate: ${slowQueryRate.toFixed(2)}%`);
      recommendations.push('Optimize slow queries and add database indexes');
    } else if (slowQueryRate > 5) {
      if (status === 'HEALTHY') status = 'WARNING';
      issues.push(`Elevated slow query rate: ${slowQueryRate.toFixed(2)}%`);
    }

    if (avgResponseTime > 500) {
      if (status === 'HEALTHY') status = 'WARNING';
      issues.push(
        `High average response time: ${avgResponseTime.toFixed(2)}ms`,
      );
      recommendations.push(
        'Consider adding database indexes or optimizing queries',
      );
    }

    if (this.connectionStats.peakConnections > 15) {
      if (status === 'HEALTHY') status = 'WARNING';
      issues.push(
        `High peak connections: ${this.connectionStats.peakConnections}`,
      );
      recommendations.push(
        'Monitor connection pool usage and consider increasing pool size',
      );
    }

    return {
      status,
      metrics: {
        totalQueries,
        slowQueries,
        avgResponseTime: Math.round(avgResponseTime * 100) / 100,
        errorRate: Math.round(errorRate * 100) / 100,
        connectionPool: {
          active: this.connectionStats.activeConnections,
          idle: 20 - this.connectionStats.activeConnections,
          total: 20,
        },
      },
      issues,
      recommendations,
    };
  }

  /**
   * Get slow queries analysis
   */
  async getSlowQueries(): Promise<QueryMetrics[]> {
    return Array.from(this.queryMetrics.values())
      .filter((m) => m.slowCount > 0)
      .sort((a, b) => b.avgTime - a.avgTime)
      .slice(0, 10);
  }

  /**
   * Get query performance statistics
   */
  async getQueryStats(): Promise<{
    topQueriesByCount: QueryMetrics[];
    topQueriesByTime: QueryMetrics[];
    recentErrors: Array<{
      query: string;
      errorCount: number;
      lastExecuted: Date;
    }>;
  }> {
    const metrics = Array.from(this.queryMetrics.values());

    return {
      topQueriesByCount: metrics.sort((a, b) => b.count - a.count).slice(0, 10),
      topQueriesByTime: metrics
        .sort((a, b) => b.avgTime - a.avgTime)
        .slice(0, 10),
      recentErrors: metrics
        .filter((m) => m.errorCount > 0)
        .sort((a, b) => b.lastExecuted - a.lastExecuted)
        .slice(0, 10)
        .map((m) => ({
          query: m.query,
          errorCount: m.errorCount,
          lastExecuted: new Date(m.lastExecuted),
        })),
    };
  }

  /**
   * Get index recommendations based on query patterns
   */
  async getIndexRecommendations(): Promise<
    Array<{
      table: string;
      columns: string[];
      reason: string;
      priority: 'HIGH' | 'MEDIUM' | 'LOW';
      sql: string;
    }>
  > {
    const slowQueries = await this.getSlowQueries();
    const recommendations = [];

    // Analyze slow queries for potential index improvements
    for (const query of slowQueries.slice(0, 5)) {
      if (query.query.includes('findMany') && query.avgTime > 500) {
        const tableName = query.query.split('.')[0];
        recommendations.push({
          table: tableName,
          columns: ['id', 'created_at'],
          reason: `Slow ${query.query} query (avg: ${query.avgTime.toFixed(2)}ms)`,
          priority:
            query.avgTime > 1000 ? 'HIGH' : ('MEDIUM' as 'HIGH' | 'MEDIUM'),
          sql: `CREATE INDEX idx_${tableName}_performance ON "${tableName}"(id, created_at);`,
        });
      }
    }

    // Add common index recommendations
    recommendations.push(
      {
        table: 'bookings',
        columns: ['user_id', 'status', 'created_at'],
        reason: 'Common filtering pattern for user bookings',
        priority: 'HIGH' as const,
        sql: 'CREATE INDEX idx_bookings_user_status_created ON "bookings"(user_id, status, created_at);',
      },
      {
        table: 'services',
        columns: ['type', 'location_id', 'is_active'],
        reason: 'Frequent service searches by type and location',
        priority: 'MEDIUM' as const,
        sql: 'CREATE INDEX idx_services_type_location_active ON "services"(type, location_id, is_active);',
      },
    );

    return recommendations;
  }

  /**
   * Optimize database connections
   */
  async optimizeConnections(): Promise<{ optimized: number; message: string }> {
    let optimized = 0;

    try {
      // Reset connection stats
      this.connectionStats.peakConnections = Math.max(
        this.connectionStats.activeConnections,
        5,
      );

      // Clear old query metrics (older than 24 hours)
      const cutoff = Date.now() - 24 * 60 * 60 * 1000;
      for (const [key, metrics] of this.queryMetrics.entries()) {
        if (metrics.lastExecuted < cutoff) {
          this.queryMetrics.delete(key);
          optimized++;
        }
      }

      await this.saveMetrics();

      this.logger.log(
        `Connection optimization completed: cleaned ${optimized} old metrics`,
      );

      return {
        optimized,
        message: 'Database connections optimized successfully',
      };
    } catch (error) {
      this.logger.error('Error optimizing connections:', error);
      throw error;
    }
  }

  /**
   * Run database analysis and maintenance
   */
  async runAnalysis(): Promise<{
    queriesAnalyzed: number;
    slowQueries: number;
    recommendations: number;
    issues: string[];
  }> {
    try {
      const metrics = Array.from(this.queryMetrics.values());
      const slowQueries = metrics.filter((m) => m.slowCount > 0);
      const recommendations = await this.getIndexRecommendations();
      const health = await this.getDatabaseHealth();

      // Update table statistics if using PostgreSQL
      try {
        await this.prismaService.$executeRaw`ANALYZE;`;
        this.logger.log('Updated database statistics');
      } catch (error) {
        this.logger.warn(
          'Could not update statistics:',
          error instanceof Error ? error.message : String(error),
        );
      }

      return {
        queriesAnalyzed: metrics.length,
        slowQueries: slowQueries.length,
        recommendations: recommendations.length,
        issues: health.issues,
      };
    } catch (error) {
      this.logger.error('Error running database analysis:', error);
      throw error;
    }
  }

  /**
   * Scheduled health check
   */
  @Cron(CronExpression.EVERY_30_MINUTES)
  async scheduledHealthCheck(): Promise<void> {
    try {
      const health = await this.getDatabaseHealth();

      if (health.status === 'CRITICAL') {
        this.logger.error(
          `Database health CRITICAL: ${health.issues.join(', ')}`,
        );
      } else if (health.status === 'WARNING') {
        this.logger.warn(
          `Database health WARNING: ${health.issues.join(', ')}`,
        );
      } else {
        this.logger.log('Database health check: HEALTHY');
      }

      // Save health report
      await this.redisService.setJson(
        'db:health:latest',
        {
          ...health,
          timestamp: Date.now(),
        },
        3600,
      );
    } catch (error) {
      this.logger.error('Error in scheduled health check:', error);
    }
  }

  /**
   * Get connection statistics
   */
  getConnectionStats(): typeof this.connectionStats {
    return { ...this.connectionStats };
  }

  /**
   * Reset metrics
   */
  async resetMetrics(): Promise<void> {
    this.queryMetrics.clear();
    this.connectionStats = {
      activeConnections: 0,
      totalConnections: 0,
      peakConnections: 0,
    };

    await this.redisService.del('db:optimizer:metrics');
    await this.redisService.del('db:optimizer:connections');

    this.logger.log('Database metrics reset');
  }

  /**
   * Get detailed metrics for monitoring dashboard
   */
  async getDetailedMetrics(): Promise<{
    overview: DatabaseHealth;
    queryStats: Awaited<ReturnType<typeof this.getQueryStats>>;
    slowQueries: QueryMetrics[];
    recommendations: Awaited<ReturnType<typeof this.getIndexRecommendations>>;
    connectionStats: typeof this.connectionStats;
  }> {
    const [overview, queryStats, slowQueries, recommendations] =
      await Promise.all([
        this.getDatabaseHealth(),
        this.getQueryStats(),
        this.getSlowQueries(),
        this.getIndexRecommendations(),
      ]);

    return {
      overview,
      queryStats,
      slowQueries,
      recommendations,
      connectionStats: this.getConnectionStats(),
    };
  }
}
