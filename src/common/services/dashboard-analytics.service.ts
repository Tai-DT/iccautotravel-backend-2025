import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';
import { Cron, CronExpression } from '@nestjs/schedule';

interface SystemOverview {
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  uptime: number;
  totalRequests: number;
  errorRate: number;
  responseTime: number;
  activeUsers: number;
}

interface MetricsSnapshot {
  timestamp: number;
  cpu: number;
  memory: number;
  requestsPerSecond: number;
  responseTime: number;
  errorRate: number;
  dbConnections: number;
  cacheHitRate: number;
}

interface Alert {
  id: string;
  type: 'PERFORMANCE' | 'SECURITY' | 'DATABASE' | 'SYSTEM';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  timestamp: number;
  acknowledged: boolean;
  value?: number;
  threshold?: number;
}

@Injectable()
export class DashboardAnalyticsService {
  private readonly logger = new Logger('DashboardAnalytics');
  private systemStartTime = Date.now();
  private metricsHistory: MetricsSnapshot[] = [];
  private activeAlerts: Alert[] = [];

  constructor(private readonly redisService: RedisService) {}

  /**
   * Get complete dashboard data
   */
  async getDashboardData(): Promise<{
    overview: SystemOverview;
    metrics: MetricsSnapshot;
    trends: {
      cpu: number[];
      memory: number[];
      responseTime: number[];
      requests: number[];
    };
    alerts: Alert[];
    services: {
      database: { status: string; responseTime: number };
      cache: { status: string; hitRate: number };
      security: { status: string; threatsBlocked: number };
    };
  }> {
    try {
      const currentMetrics = await this.collectCurrentMetrics();
      const overview = await this.getSystemOverview();
      const trends = this.getTrends();
      const serviceStatus = await this.getServiceStatus();

      return {
        overview,
        metrics: currentMetrics,
        trends,
        alerts: this.activeAlerts.slice(0, 10),
        services: serviceStatus,
      };
    } catch (error) {
      this.logger.error('Error getting dashboard data:', error);
      throw error;
    }
  }

  /**
   * Collect current system metrics
   */
  private async collectCurrentMetrics(): Promise<MetricsSnapshot> {
    try {
      // Simulate collecting real metrics
      const memUsage = process.memoryUsage();
      const cpuUsage = Math.random() * 30 + 20; // Simulate 20-50% CPU

      const metrics: MetricsSnapshot = {
        timestamp: Date.now(),
        cpu: Math.round(cpuUsage * 100) / 100,
        memory:
          Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100 * 100) /
          100,
        requestsPerSecond: Math.round(Math.random() * 100 + 50),
        responseTime: Math.round(Math.random() * 200 + 100),
        errorRate: Math.round(Math.random() * 2 * 100) / 100,
        dbConnections: Math.round(Math.random() * 5 + 10),
        cacheHitRate: Math.round((Math.random() * 20 + 80) * 100) / 100,
      };

      // Store in history
      this.metricsHistory.push(metrics);
      if (this.metricsHistory.length > 60) {
        // Keep last hour
        this.metricsHistory.shift();
      }

      // Save to Redis
      await this.redisService.setJson(
        'dashboard:metrics:current',
        metrics,
        300,
      );
      await this.redisService.setJson(
        'dashboard:metrics:history',
        this.metricsHistory,
        3600,
      );

      // Check for alerts
      await this.checkMetricAlerts(metrics);

      return metrics;
    } catch (error) {
      this.logger.error('Error collecting metrics:', error);
      throw error;
    }
  }

  /**
   * Get system overview
   */
  private async getSystemOverview(): Promise<SystemOverview> {
    const uptime = Math.floor((Date.now() - this.systemStartTime) / 1000);
    const currentMetrics = this.metricsHistory[this.metricsHistory.length - 1];

    if (!currentMetrics) {
      return {
        status: 'WARNING',
        uptime,
        totalRequests: 0,
        errorRate: 0,
        responseTime: 0,
        activeUsers: 0,
      };
    }

    // Determine overall status
    let status: 'HEALTHY' | 'WARNING' | 'CRITICAL' = 'HEALTHY';
    const criticalAlerts = this.activeAlerts.filter(
      (a) => a.severity === 'CRITICAL' && !a.acknowledged,
    );
    const highAlerts = this.activeAlerts.filter(
      (a) => a.severity === 'HIGH' && !a.acknowledged,
    );

    if (
      criticalAlerts.length > 0 ||
      currentMetrics.cpu > 90 ||
      currentMetrics.memory > 95
    ) {
      status = 'CRITICAL';
    } else if (
      highAlerts.length > 0 ||
      currentMetrics.cpu > 70 ||
      currentMetrics.memory > 80
    ) {
      status = 'WARNING';
    }

    return {
      status,
      uptime,
      totalRequests: Math.round(Math.random() * 10000 + 5000),
      errorRate: currentMetrics.errorRate,
      responseTime: currentMetrics.responseTime,
      activeUsers: Math.round(Math.random() * 200 + 100),
    };
  }

  /**
   * Get performance trends
   */
  private getTrends(): {
    cpu: number[];
    memory: number[];
    responseTime: number[];
    requests: number[];
  } {
    const recentMetrics = this.metricsHistory.slice(-30); // Last 30 data points

    return {
      cpu: recentMetrics.map((m) => m.cpu),
      memory: recentMetrics.map((m) => m.memory),
      responseTime: recentMetrics.map((m) => m.responseTime),
      requests: recentMetrics.map((m) => m.requestsPerSecond),
    };
  }

  /**
   * Get service status
   */
  private async getServiceStatus(): Promise<{
    database: { status: string; responseTime: number };
    cache: { status: string; hitRate: number };
    security: { status: string; threatsBlocked: number };
  }> {
    try {
      // Get latest metrics
      const currentMetrics =
        this.metricsHistory[this.metricsHistory.length - 1];

      return {
        database: {
          status: currentMetrics?.dbConnections > 15 ? 'WARNING' : 'HEALTHY',
          responseTime: Math.round(Math.random() * 50 + 20),
        },
        cache: {
          status: currentMetrics?.cacheHitRate < 70 ? 'WARNING' : 'HEALTHY',
          hitRate: currentMetrics?.cacheHitRate || 85,
        },
        security: {
          status: 'HEALTHY',
          threatsBlocked: Math.round(Math.random() * 20 + 5),
        },
      };
    } catch (error) {
      this.logger.error('Error getting service status:', error);
      return {
        database: { status: 'UNKNOWN', responseTime: 0 },
        cache: { status: 'UNKNOWN', hitRate: 0 },
        security: { status: 'UNKNOWN', threatsBlocked: 0 },
      };
    }
  }

  /**
   * Check for metric-based alerts
   */
  private async checkMetricAlerts(metrics: MetricsSnapshot): Promise<void> {
    const alerts: Alert[] = [];

    // CPU usage alert
    if (metrics.cpu > 80) {
      alerts.push({
        id: `cpu_${Date.now()}`,
        type: 'PERFORMANCE',
        severity: metrics.cpu > 90 ? 'CRITICAL' : 'HIGH',
        message: `High CPU usage: ${metrics.cpu}%`,
        timestamp: Date.now(),
        acknowledged: false,
        value: metrics.cpu,
        threshold: 80,
      });
    }

    // Memory usage alert
    if (metrics.memory > 80) {
      alerts.push({
        id: `memory_${Date.now()}`,
        type: 'PERFORMANCE',
        severity: metrics.memory > 90 ? 'CRITICAL' : 'HIGH',
        message: `High memory usage: ${metrics.memory}%`,
        timestamp: Date.now(),
        acknowledged: false,
        value: metrics.memory,
        threshold: 80,
      });
    }

    // Response time alert
    if (metrics.responseTime > 1000) {
      alerts.push({
        id: `response_${Date.now()}`,
        type: 'PERFORMANCE',
        severity: metrics.responseTime > 2000 ? 'HIGH' : 'MEDIUM',
        message: `High response time: ${metrics.responseTime}ms`,
        timestamp: Date.now(),
        acknowledged: false,
        value: metrics.responseTime,
        threshold: 1000,
      });
    }

    // Error rate alert
    if (metrics.errorRate > 5) {
      alerts.push({
        id: `error_${Date.now()}`,
        type: 'SYSTEM',
        severity: metrics.errorRate > 10 ? 'CRITICAL' : 'HIGH',
        message: `High error rate: ${metrics.errorRate}%`,
        timestamp: Date.now(),
        acknowledged: false,
        value: metrics.errorRate,
        threshold: 5,
      });
    }

    // Cache hit rate alert
    if (metrics.cacheHitRate < 70) {
      alerts.push({
        id: `cache_${Date.now()}`,
        type: 'PERFORMANCE',
        severity: 'MEDIUM',
        message: `Low cache hit rate: ${metrics.cacheHitRate}%`,
        timestamp: Date.now(),
        acknowledged: false,
        value: metrics.cacheHitRate,
        threshold: 70,
      });
    }

    // Add new alerts
    if (alerts.length > 0) {
      this.activeAlerts.push(...alerts);

      // Log alerts
      for (const alert of alerts) {
        if (alert.severity === 'CRITICAL') {
          this.logger.error(`CRITICAL ALERT: ${alert.message}`);
        } else if (alert.severity === 'HIGH') {
          this.logger.warn(`HIGH ALERT: ${alert.message}`);
        } else {
          this.logger.log(`Alert: ${alert.message}`);
        }
      }

      // Save alerts to Redis
      await this.redisService.setJson(
        'dashboard:alerts:active',
        this.activeAlerts,
        86400,
      );
    }
  }

  /**
   * Acknowledge alert
   */
  async acknowledgeAlert(alertId: string): Promise<boolean> {
    try {
      const alertIndex = this.activeAlerts.findIndex((a) => a.id === alertId);
      if (alertIndex === -1) {
        return false;
      }

      this.activeAlerts[alertIndex].acknowledged = true;
      await this.redisService.setJson(
        'dashboard:alerts:active',
        this.activeAlerts,
        86400,
      );

      this.logger.log(`Alert ${alertId} acknowledged`);
      return true;
    } catch (error) {
      this.logger.error('Error acknowledging alert:', error);
      return false;
    }
  }

  /**
   * Get system health score
   */
  async getHealthScore(): Promise<{
    score: number;
    status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
    factors: Array<{ name: string; score: number; impact: number }>;
  }> {
    try {
      const currentMetrics =
        this.metricsHistory[this.metricsHistory.length - 1];
      if (!currentMetrics) {
        return { score: 0, status: 'CRITICAL', factors: [] };
      }

      const factors = [
        {
          name: 'CPU Usage',
          score: Math.max(0, 100 - currentMetrics.cpu),
          impact: 25,
        },
        {
          name: 'Memory Usage',
          score: Math.max(0, 100 - currentMetrics.memory),
          impact: 25,
        },
        {
          name: 'Response Time',
          score: Math.max(0, 100 - currentMetrics.responseTime / 20),
          impact: 20,
        },
        {
          name: 'Error Rate',
          score: Math.max(0, 100 - currentMetrics.errorRate * 10),
          impact: 20,
        },
        {
          name: 'Cache Hit Rate',
          score: currentMetrics.cacheHitRate,
          impact: 10,
        },
      ];

      const totalScore = factors.reduce((sum, factor) => {
        return sum + (factor.score * factor.impact) / 100;
      }, 0);

      let status: 'HEALTHY' | 'WARNING' | 'CRITICAL' = 'HEALTHY';
      if (totalScore < 60) {
        status = 'CRITICAL';
      } else if (totalScore < 80) {
        status = 'WARNING';
      }

      return {
        score: Math.round(totalScore),
        status,
        factors,
      };
    } catch (error) {
      this.logger.error('Error calculating health score:', error);
      return { score: 0, status: 'CRITICAL', factors: [] };
    }
  }

  /**
   * Get analytics summary
   */
  async getAnalyticsSummary(): Promise<{
    requests: { total: number; perSecond: number; growth: number };
    performance: { avgResponseTime: number; improvement: number };
    errors: { total: number; rate: number; change: number };
    uptime: { seconds: number; percentage: number };
  }> {
    const currentMetrics = this.metricsHistory[this.metricsHistory.length - 1];
    const previousMetrics = this.metricsHistory[this.metricsHistory.length - 2];

    const uptime = Date.now() - this.systemStartTime;
    const uptimePercentage = 99.5; // Mock uptime percentage

    return {
      requests: {
        total: Math.round(Math.random() * 50000 + 10000),
        perSecond: currentMetrics?.requestsPerSecond || 0,
        growth:
          previousMetrics && currentMetrics
            ? ((currentMetrics.requestsPerSecond -
                previousMetrics.requestsPerSecond) /
                previousMetrics.requestsPerSecond) *
              100
            : 0,
      },
      performance: {
        avgResponseTime: currentMetrics?.responseTime || 0,
        improvement:
          previousMetrics && currentMetrics
            ? ((previousMetrics.responseTime - currentMetrics.responseTime) /
                previousMetrics.responseTime) *
              100
            : 0,
      },
      errors: {
        total: Math.round(Math.random() * 100 + 10),
        rate: currentMetrics?.errorRate || 0,
        change:
          previousMetrics && currentMetrics
            ? currentMetrics.errorRate - previousMetrics.errorRate
            : 0,
      },
      uptime: {
        seconds: Math.floor(uptime / 1000),
        percentage: uptimePercentage,
      },
    };
  }

  /**
   * Scheduled metrics collection
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async scheduledMetricsCollection(): Promise<void> {
    try {
      await this.collectCurrentMetrics();
    } catch (error) {
      this.logger.error('Error in scheduled metrics collection:', error);
    }
  }

  /**
   * Scheduled cleanup
   */
  @Cron(CronExpression.EVERY_HOUR)
  async scheduledCleanup(): Promise<void> {
    try {
      // Clean up old alerts (older than 24 hours)
      const cutoff = Date.now() - 24 * 60 * 60 * 1000;
      this.activeAlerts = this.activeAlerts.filter(
        (alert) => alert.timestamp > cutoff || !alert.acknowledged,
      );

      // Save cleaned alerts
      await this.redisService.setJson(
        'dashboard:alerts:active',
        this.activeAlerts,
        86400,
      );

      this.logger.log('Dashboard analytics cleanup completed');
    } catch (error) {
      this.logger.error('Error in scheduled cleanup:', error);
    }
  }

  /**
   * Get real-time metrics stream
   */
  async getRealtimeMetrics(): Promise<{
    timestamp: number;
    cpu: number;
    memory: number;
    requests: number;
    responseTime: number;
    errors: number;
  }> {
    const currentMetrics = this.metricsHistory[this.metricsHistory.length - 1];

    return {
      timestamp: Date.now(),
      cpu: currentMetrics?.cpu || 0,
      memory: currentMetrics?.memory || 0,
      requests: currentMetrics?.requestsPerSecond || 0,
      responseTime: currentMetrics?.responseTime || 0,
      errors: currentMetrics?.errorRate || 0,
    };
  }
}
