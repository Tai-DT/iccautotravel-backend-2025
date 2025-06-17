import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../redis/redis.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CircuitBreakerService } from './circuit-breaker.service';
import { MemoryMonitorService } from './memory-monitor.service';
import { QueryOptimizerService } from './query-optimizer.service';
import { Cron, CronExpression } from '@nestjs/schedule';

interface SystemMetrics {
  timestamp: number;
  memory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
  database: {
    activeConnections: number;
    queryCount: number;
    avgQueryTime: number;
    slowQueries: number;
  };
  cache: {
    hitRate: number;
    totalKeys: number;
    memoryUsage: number;
  };
  circuits: Record<string, any>;
  api: {
    totalRequests: number;
    errorRate: number;
    avgResponseTime: number;
  };
}

interface AlertRule {
  metric: string;
  threshold: number;
  operator: 'gt' | 'lt' | 'eq';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
}

@Injectable()
export class AdvancedMonitoringService implements OnModuleInit {
  private readonly logger = new Logger('AdvancedMonitoring');
  private readonly alerts: AlertRule[] = [];
  private metricsHistory: SystemMetrics[] = [];

  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    private readonly prismaService: PrismaService,
    private readonly circuitBreaker: CircuitBreakerService,
    private readonly memoryMonitor: MemoryMonitorService,
    private readonly queryOptimizer: QueryOptimizerService,
  ) {
    this.setupDefaultAlerts();
  }

  onModuleInit() {
    if (this.configService.get('NODE_ENV') === 'production') {
      this.logger.log('Starting advanced monitoring...');
    }
  }

  private setupDefaultAlerts(): void {
    this.alerts.push(
      {
        metric: 'memory.heapUsed',
        threshold: 800 * 1024 * 1024, // 800MB
        operator: 'gt',
        severity: 'high',
        message: 'High memory usage detected',
      },
      {
        metric: 'database.avgQueryTime',
        threshold: 1000, // 1 second
        operator: 'gt',
        severity: 'medium',
        message: 'Database queries are slow',
      },
      {
        metric: 'api.errorRate',
        threshold: 5, // 5%
        operator: 'gt',
        severity: 'high',
        message: 'High API error rate detected',
      },
      {
        metric: 'cache.hitRate',
        threshold: 80, // 80%
        operator: 'lt',
        severity: 'low',
        message: 'Low cache hit rate',
      },
    );
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async collectMetrics(): Promise<void> {
    try {
      const metrics = await this.gatherSystemMetrics();
      await this.storeMetrics(metrics);
      await this.checkAlerts(metrics);

      // Keep metrics in memory for quick access (last 60 minutes)
      this.metricsHistory.push(metrics);
      if (this.metricsHistory.length > 60) {
        this.metricsHistory.shift();
      }
    } catch (error) {
      this.logger.error('Error collecting metrics:', error);
    }
  }

  private async gatherSystemMetrics(): Promise<SystemMetrics> {
    const timestamp = Date.now();

    // Memory metrics
    const memoryStats = await this.memoryMonitor.getMemoryStats();

    // Database metrics
    const queryStats = await this.queryOptimizer.getQueryStats(5); // Last 5 minutes
    const dbMetrics = {
      activeConnections: await this.getActiveConnections(),
      queryCount: queryStats.totalQueries,
      avgQueryTime: queryStats.averageTime,
      slowQueries: queryStats.slowQueries,
    };

    // Cache metrics
    const cacheStats = await this.getCacheMetrics();

    // Circuit breaker metrics
    const circuits = await this.circuitBreaker.getAllCircuitsHealth();

    // API metrics (simplified - would need request tracking)
    const apiMetrics = await this.getApiMetrics();

    return {
      timestamp,
      memory: {
        rss: memoryStats.rss,
        heapTotal: memoryStats.heapTotal,
        heapUsed: memoryStats.heapUsed,
        external: memoryStats.external,
      },
      database: dbMetrics,
      cache: cacheStats,
      circuits,
      api: apiMetrics,
    };
  }

  private async getActiveConnections(): Promise<number> {
    try {
      // This is a simplified approach - Prisma doesn't expose active connection count easily
      return 1; // Placeholder
    } catch (error) {
      return 0;
    }
  }

  private async getCacheMetrics(): Promise<any> {
    try {
      const totalKeys = (await this.redisService.keys('*')).length;

      // Get memory usage from Redis INFO command
      const info = await this.redisService.getClient().info('memory');
      const memoryMatch = info.match(/used_memory:(\d+)/);
      const memoryUsage = memoryMatch ? parseInt(memoryMatch[1]) : 0;

      return {
        hitRate: 85, // Placeholder - would need to track hits/misses
        totalKeys,
        memoryUsage,
      };
    } catch (error) {
      return { hitRate: 0, totalKeys: 0, memoryUsage: 0 };
    }
  }

  private async getApiMetrics(): Promise<any> {
    try {
      // This would require request tracking middleware to collect real data
      return {
        totalRequests: 100, // Placeholder
        errorRate: 2.5, // Placeholder
        avgResponseTime: 150, // Placeholder
      };
    } catch (error) {
      return { totalRequests: 0, errorRate: 0, avgResponseTime: 0 };
    }
  }

  private async storeMetrics(metrics: SystemMetrics): Promise<void> {
    try {
      const key = `metrics:${Math.floor(metrics.timestamp / 60000)}`; // Per minute
      await this.redisService.setJson(key, metrics, 3600 * 24); // Keep for 24 hours
    } catch (error) {
      this.logger.error('Error storing metrics:', error);
    }
  }

  private async checkAlerts(metrics: SystemMetrics): Promise<void> {
    for (const alert of this.alerts) {
      const value = this.getMetricValue(metrics, alert.metric);

      if (
        value !== null &&
        this.evaluateThreshold(value, alert.threshold, alert.operator)
      ) {
        await this.triggerAlert(alert, value, metrics.timestamp);
      }
    }
  }

  private getMetricValue(
    metrics: SystemMetrics,
    metricPath: string,
  ): number | null {
    const path = metricPath.split('.');
    let value: any = metrics;

    for (const segment of path) {
      if (value && typeof value === 'object' && segment in value) {
        value = value[segment];
      } else {
        return null;
      }
    }

    return typeof value === 'number' ? value : null;
  }

  private evaluateThreshold(
    value: number,
    threshold: number,
    operator: string,
  ): boolean {
    switch (operator) {
      case 'gt':
        return value > threshold;
      case 'lt':
        return value < threshold;
      case 'eq':
        return value === threshold;
      default:
        return false;
    }
  }

  private async triggerAlert(
    alert: AlertRule,
    value: number,
    timestamp: number,
  ): Promise<void> {
    const alertKey = `alert:${alert.metric}:${timestamp}`;

    // Check if we've already sent this alert recently (within 10 minutes)
    const recentAlert = await this.redisService.get(
      `alert_cooldown:${alert.metric}`,
    );
    if (recentAlert) {
      return; // Skip duplicate alerts
    }

    this.logger.warn(
      `🚨 ALERT [${alert.severity.toUpperCase()}]: ${alert.message}`,
      {
        metric: alert.metric,
        value,
        threshold: alert.threshold,
        timestamp: new Date(timestamp).toISOString(),
      },
    );

    // Store alert
    await this.redisService.setJson(
      alertKey,
      {
        metric: alert.metric,
        message: alert.message,
        severity: alert.severity,
        value,
        threshold: alert.threshold,
        timestamp,
      },
      3600 * 24,
    ); // Keep alerts for 24 hours

    // Set cooldown to prevent spam
    await this.redisService.set(`alert_cooldown:${alert.metric}`, '1', 600); // 10 minutes cooldown
  }

  // Public methods for getting metrics
  async getCurrentMetrics(): Promise<SystemMetrics | null> {
    return this.metricsHistory.length > 0
      ? this.metricsHistory[this.metricsHistory.length - 1]
      : null;
  }

  async getMetricsHistory(minutes: number = 60): Promise<SystemMetrics[]> {
    const now = Date.now();
    const history: SystemMetrics[] = [];

    for (let i = 0; i < minutes; i++) {
      const timestamp = now - i * 60000;
      const key = `metrics:${Math.floor(timestamp / 60000)}`;

      try {
        const metrics = await this.redisService.getJson<SystemMetrics>(key);
        if (metrics) {
          history.push(metrics);
        }
      } catch (error) {
        // Skip missing data points
      }
    }

    return history.reverse(); // Return chronological order
  }

  async getRecentAlerts(hours: number = 24): Promise<any[]> {
    try {
      const pattern = 'alert:*';
      const keys = await this.redisService.keys(pattern);
      const alerts: any[] = [];

      for (const key of keys) {
        const alert = await this.redisService.getJson(key);
        if (alert && typeof alert === 'object' && 'timestamp' in alert) {
          const timestamp = alert.timestamp as number;
          if (timestamp > Date.now() - hours * 60 * 60 * 1000) {
            alerts.push(alert);
          }
        }
      }

      return alerts.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      return [];
    }
  }

  async getSystemHealthSummary(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    score: number;
    issues: string[];
    metrics: SystemMetrics | null;
  }> {
    const currentMetrics = await this.getCurrentMetrics();
    if (!currentMetrics) {
      return {
        status: 'warning',
        score: 50,
        issues: ['No metrics available'],
        metrics: null,
      };
    }

    const issues: string[] = [];
    let score = 100;

    // Check memory usage
    const memoryUsageMB = currentMetrics.memory.heapUsed / 1024 / 1024;
    if (memoryUsageMB > 800) {
      issues.push(`High memory usage: ${Math.round(memoryUsageMB)}MB`);
      score -= 20;
    } else if (memoryUsageMB > 500) {
      issues.push(`Moderate memory usage: ${Math.round(memoryUsageMB)}MB`);
      score -= 10;
    }

    // Check database performance
    if (currentMetrics.database.avgQueryTime > 1000) {
      issues.push(
        `Slow database queries: ${currentMetrics.database.avgQueryTime}ms avg`,
      );
      score -= 15;
    }

    // Check cache performance
    if (currentMetrics.cache.hitRate < 80) {
      issues.push(`Low cache hit rate: ${currentMetrics.cache.hitRate}%`);
      score -= 10;
    }

    // Check circuit breakers
    const openCircuits = Object.entries(currentMetrics.circuits).filter(
      ([_, health]: [string, any]) => health.state === 'OPEN',
    );
    if (openCircuits.length > 0) {
      issues.push(`${openCircuits.length} circuit breaker(s) open`);
      score -= 25;
    }

    // Determine overall status
    let status: 'healthy' | 'warning' | 'critical';
    if (score >= 90) {
      status = 'healthy';
    } else if (score >= 70) {
      status = 'warning';
    } else {
      status = 'critical';
    }

    return { status, score, issues, metrics: currentMetrics };
  }
}
