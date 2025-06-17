import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';

interface QueryMetrics {
  query: string;
  executionTime: number;
  timestamp: number;
  model: string;
  operation: string;
}

interface QueryStats {
  totalQueries: number;
  averageTime: number;
  slowQueries: number;
  topSlowQueries: QueryMetrics[];
}

@Injectable()
export class QueryOptimizerService {
  private readonly logger = new Logger('QueryOptimizer');
  private readonly SLOW_QUERY_THRESHOLD = 1000; // 1 second
  private readonly MAX_SLOW_QUERIES_STORED = 50;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {
    this.setupQueryLogging();
  }

  private setupQueryLogging(): void {
    // Hook into Prisma's query logging
    this.prisma.$use(async (params, next) => {
      const startTime = Date.now();
      const result = await next(params);
      const executionTime = Date.now() - startTime;

      // Log slow queries
      if (executionTime > this.SLOW_QUERY_THRESHOLD) {
        await this.logSlowQuery(params, executionTime);
      }

      // Store query metrics
      await this.storeQueryMetrics(params, executionTime);

      return result;
    });
  }

  private async logSlowQuery(
    params: any,
    executionTime: number,
  ): Promise<void> {
    const queryInfo = {
      model: params.model,
      action: params.action,
      executionTime,
      args: JSON.stringify(params.args, null, 2),
    };

    this.logger.warn(
      `Slow query detected: ${params.model}.${params.action} - ${executionTime}ms`,
      queryInfo,
    );

    // Store in Redis for analysis
    const key = `slow_queries:${Date.now()}`;
    await this.redisService.setJson(key, queryInfo, 3600); // Keep for 1 hour
  }

  private async storeQueryMetrics(
    params: any,
    executionTime: number,
  ): Promise<void> {
    try {
      const metrics: QueryMetrics = {
        query: `${params.model}.${params.action}`,
        executionTime,
        timestamp: Date.now(),
        model: params.model,
        operation: params.action,
      };

      // Store in time-based buckets (per minute)
      const minute = Math.floor(Date.now() / 60000);
      const key = `query_metrics:${minute}`;

      const existingMetrics =
        (await this.redisService.getJson<QueryMetrics[]>(key)) || [];
      existingMetrics.push(metrics);

      await this.redisService.setJson(key, existingMetrics, 3600); // Keep for 1 hour
    } catch (error) {
      // Don't log this error as it's not critical
    }
  }

  async getQueryStats(minutes: number = 60): Promise<QueryStats> {
    const now = Date.now();
    const allMetrics: QueryMetrics[] = [];

    // Collect metrics from the last N minutes
    for (let i = 0; i < minutes; i++) {
      const minute = Math.floor((now - i * 60000) / 60000);
      const key = `query_metrics:${minute}`;

      try {
        const metrics = await this.redisService.getJson<QueryMetrics[]>(key);
        if (metrics) {
          allMetrics.push(...metrics);
        }
      } catch (error) {
        // Skip missing data
      }
    }

    if (allMetrics.length === 0) {
      return {
        totalQueries: 0,
        averageTime: 0,
        slowQueries: 0,
        topSlowQueries: [],
      };
    }

    const totalTime = allMetrics.reduce(
      (sum, metric) => sum + metric.executionTime,
      0,
    );
    const slowQueries = allMetrics.filter(
      (metric) => metric.executionTime > this.SLOW_QUERY_THRESHOLD,
    );

    // Get top slow queries
    const topSlowQueries = [...slowQueries]
      .sort((a, b) => b.executionTime - a.executionTime)
      .slice(0, 10);

    return {
      totalQueries: allMetrics.length,
      averageTime: Math.round(totalTime / allMetrics.length),
      slowQueries: slowQueries.length,
      topSlowQueries,
    };
  }

  async getModelStats(minutes: number = 60): Promise<Record<string, any>> {
    const stats = await this.getQueryStats(minutes);
    const now = Date.now();
    const modelStats: Record<
      string,
      { count: number; totalTime: number; slowCount: number }
    > = {};

    // Collect metrics grouped by model
    for (let i = 0; i < minutes; i++) {
      const minute = Math.floor((now - i * 60000) / 60000);
      const key = `query_metrics:${minute}`;

      try {
        const metrics = await this.redisService.getJson<QueryMetrics[]>(key);
        if (metrics) {
          metrics.forEach((metric) => {
            if (!modelStats[metric.model]) {
              modelStats[metric.model] = {
                count: 0,
                totalTime: 0,
                slowCount: 0,
              };
            }

            modelStats[metric.model].count++;
            modelStats[metric.model].totalTime += metric.executionTime;

            if (metric.executionTime > this.SLOW_QUERY_THRESHOLD) {
              modelStats[metric.model].slowCount++;
            }
          });
        }
      } catch (error) {
        // Skip missing data
      }
    }

    // Calculate averages
    Object.keys(modelStats).forEach((model) => {
      const stats = modelStats[model];
      stats['averageTime'] = Math.round(stats.totalTime / stats.count);
      stats['slowPercentage'] = Math.round(
        (stats.slowCount / stats.count) * 100,
      );
    });

    return modelStats;
  }

  async suggestOptimizations(): Promise<string[]> {
    const suggestions: string[] = [];
    const stats = await this.getQueryStats(60);
    const modelStats = await this.getModelStats(60);

    // General suggestions based on stats
    if (stats.slowQueries > stats.totalQueries * 0.1) {
      suggestions.push('Consider adding indexes for frequently queried fields');
    }

    if (stats.averageTime > 500) {
      suggestions.push(
        'Overall query performance is slow - review database configuration',
      );
    }

    // Model-specific suggestions
    Object.entries(modelStats).forEach(([model, modelStat]: [string, any]) => {
      if (modelStat.slowPercentage > 20) {
        suggestions.push(
          `Model "${model}" has ${modelStat.slowPercentage}% slow queries - consider optimization`,
        );
      }

      if (modelStat.averageTime > 1000) {
        suggestions.push(
          `Model "${model}" queries are slow (avg: ${modelStat.averageTime}ms) - review indexes`,
        );
      }
    });

    // Top slow queries analysis
    stats.topSlowQueries.forEach((query) => {
      if (query.executionTime > 5000) {
        suggestions.push(
          `Critical: ${query.query} took ${query.executionTime}ms - immediate optimization needed`,
        );
      }
    });

    return suggestions;
  }

  async clearOldMetrics(): Promise<void> {
    try {
      const pattern = 'query_metrics:*';
      const keys = await this.redisService.keys(pattern);

      // Keep only the last 2 hours of metrics
      const twoHoursAgo = Math.floor((Date.now() - 2 * 60 * 60 * 1000) / 60000);

      for (const key of keys) {
        const minute = parseInt(key.split(':')[1]);
        if (minute < twoHoursAgo) {
          await this.redisService.del(key);
        }
      }

      this.logger.debug(`Cleaned up old query metrics`);
    } catch (error) {
      this.logger.error('Error cleaning up old metrics:', error);
    }
  }
}
