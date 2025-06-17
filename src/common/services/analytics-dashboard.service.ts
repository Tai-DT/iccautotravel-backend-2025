import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';
import { AdvancedMonitoringService } from './advanced-monitoring.service';
import { CircuitBreakerService } from './circuit-breaker.service';
import { AdvancedSecurityService } from './advanced-security.service';
import { DatabasePerformanceService } from './db-performance.service';
import { Cron, CronExpression } from '@nestjs/schedule';

interface SystemMetrics {
  timestamp: number;
  performance: {
    cpu: number;
    memory: number;
    responseTime: number;
    requestsPerSecond: number;
    errorRate: number;
  };
  database: {
    status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
    slowQueries: number;
    avgResponseTime: number;
    connectionPool: number;
  };
  security: {
    totalRequests: number;
    blockedRequests: number;
    activeBans: number;
    riskScore: number;
  };
  circuitBreakers: {
    totalCircuits: number;
    openCircuits: number;
    failureRate: number;
  };
  cache: {
    hitRate: number;
    evictions: number;
    memoryUsage: number;
  };
}

interface AlertRule {
  id: string;
  name: string;
  metric: string;
  operator: '>' | '<' | '=' | '>=' | '<=';
  threshold: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  enabled: boolean;
  cooldown: number; // in minutes
  lastTriggered?: number;
}

interface Alert {
  id: string;
  ruleId: string;
  ruleName: string;
  message: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  value: number;
  threshold: number;
  timestamp: number;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: number;
}

interface DashboardData {
  overview: {
    status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
    uptime: number;
    totalRequests: number;
    activeUsers: number;
    errorRate: number;
    responseTime: number;
  };
  metrics: SystemMetrics;
  alerts: Alert[];
  trends: {
    requestsLastHour: number[];
    responseTimeLastHour: number[];
    errorRateLastHour: number[];
  };
  services: {
    database: { status: string; responseTime: number };
    redis: { status: string; memoryUsage: number };
    security: { status: string; threatsBlocked: number };
    circuitBreakers: { status: string; openCircuits: number };
  };
}

@Injectable()
export class AnalyticsDashboardService {
  private readonly logger = new Logger('AnalyticsDashboard');
  private alertRules: AlertRule[] = [];
  private systemStartTime = Date.now();
  private metricHistory: SystemMetrics[] = [];

  constructor(
    private readonly redisService: RedisService,
    private readonly monitoringService: AdvancedMonitoringService,
    private readonly circuitBreakerService: CircuitBreakerService,
    private readonly securityService: AdvancedSecurityService,
    private readonly dbPerformanceService: DatabasePerformanceService,
  ) {
    this.initializeDefaultAlerts();
  }

  /**
   * Initialize default alert rules
   */
  private initializeDefaultAlerts(): void {
    this.alertRules = [
      {
        id: 'cpu-high',
        name: 'High CPU Usage',
        metric: 'performance.cpu',
        operator: '>',
        threshold: 80,
        severity: 'HIGH',
        enabled: true,
        cooldown: 5,
      },
      {
        id: 'memory-high',
        name: 'High Memory Usage',
        metric: 'performance.memory',
        operator: '>',
        threshold: 85,
        severity: 'HIGH',
        enabled: true,
        cooldown: 5,
      },
      {
        id: 'response-time-high',
        name: 'High Response Time',
        metric: 'performance.responseTime',
        operator: '>',
        threshold: 2000,
        severity: 'MEDIUM',
        enabled: true,
        cooldown: 3,
      },
      {
        id: 'error-rate-high',
        name: 'High Error Rate',
        metric: 'performance.errorRate',
        operator: '>',
        threshold: 5,
        severity: 'CRITICAL',
        enabled: true,
        cooldown: 2,
      },
      {
        id: 'db-slow-queries',
        name: 'Database Slow Queries',
        metric: 'database.slowQueries',
        operator: '>',
        threshold: 10,
        severity: 'MEDIUM',
        enabled: true,
        cooldown: 10,
      },
      {
        id: 'security-threats',
        name: 'Security Threats Detected',
        metric: 'security.blockedRequests',
        operator: '>',
        threshold: 100,
        severity: 'HIGH',
        enabled: true,
        cooldown: 15,
      },
      {
        id: 'circuit-breakers-open',
        name: 'Circuit Breakers Open',
        metric: 'circuitBreakers.openCircuits',
        operator: '>',
        threshold: 0,
        severity: 'CRITICAL',
        enabled: true,
        cooldown: 5,
      },
      {
        id: 'cache-hit-rate-low',
        name: 'Low Cache Hit Rate',
        metric: 'cache.hitRate',
        operator: '<',
        threshold: 70,
        severity: 'MEDIUM',
        enabled: true,
        cooldown: 30,
      },
    ];
  }

  /**
   * Collect all system metrics
   */
  async collectSystemMetrics(): Promise<SystemMetrics> {
    try {
      const [
        systemHealth,
        dbReport,
        securityMetrics,
        circuitStats,
        cacheStats,
      ] = await Promise.all([
        this.monitoringService.getSystemHealthSummary(),
        this.dbPerformanceService.getPerformanceReport(),
        this.securityService.getSecurityMetrics(),
        this.circuitBreakerService.getCircuitStatistics(),
        this.getCacheMetrics(),
      ]);

      const metrics: SystemMetrics = {
        timestamp: Date.now(),
        performance: {
          cpu: systemHealth.metrics?.memory?.heapUsed || 50, // Use memory as cpu proxy
          memory: (systemHealth.metrics?.memory?.heapUsed || 0) / 1024 / 1024, // Convert to MB
          responseTime: systemHealth.metrics?.api?.avgResponseTime || 100,
          requestsPerSecond:
            (systemHealth.metrics?.api?.totalRequests || 0) / 60, // Approximate
          errorRate: systemHealth.metrics?.api?.errorRate || 0,
        },
        database: {
          status: dbReport.status,
          slowQueries: dbReport.slowQueries,
          avgResponseTime: dbReport.avgResponseTime,
          connectionPool: 85, // Mock value
        },
        security: {
          totalRequests: securityMetrics.totalRequests,
          blockedRequests: securityMetrics.blockedRequests,
          activeBans: securityMetrics.bannedIPs,
          riskScore: 25, // Average risk score
        },
        circuitBreakers: {
          totalCircuits: circuitStats.totalCircuits,
          openCircuits: circuitStats.openCircuits,
          failureRate: circuitStats.averageFailureRate,
        },
        cache: {
          hitRate: cacheStats.hitRate,
          evictions: cacheStats.evictions,
          memoryUsage: cacheStats.memoryUsage,
        },
      };

      // Store in history (keep last 24 hours)
      this.metricHistory.push(metrics);
      if (this.metricHistory.length > 1440) {
        // 24 hours * 60 minutes
        this.metricHistory.shift();
      }

      // Save to Redis
      await this.redisService.setJson('analytics:metrics:latest', metrics, 300);
      await this.redisService.setJson(
        'analytics:metrics:history',
        this.metricHistory.slice(-60),
        3600,
      ); // Last hour

      return metrics;
    } catch (error) {
      this.logger.error('Error collecting system metrics:', error);
      throw error;
    }
  }

  /**
   * Get cache metrics
   */
  private async getCacheMetrics(): Promise<{
    hitRate: number;
    evictions: number;
    memoryUsage: number;
  }> {
    try {
      // Get Redis INFO
      const info = await this.redisService.getClient().info('stats');
      const lines = info.split('\r\n');

      let hits = 0;
      let misses = 0;
      let evictions = 0;
      let memoryUsage = 0;

      for (const line of lines) {
        if (line.startsWith('keyspace_hits:')) {
          hits = parseInt(line.split(':')[1]);
        } else if (line.startsWith('keyspace_misses:')) {
          misses = parseInt(line.split(':')[1]);
        } else if (line.startsWith('evicted_keys:')) {
          evictions = parseInt(line.split(':')[1]);
        } else if (line.startsWith('used_memory:')) {
          memoryUsage = parseInt(line.split(':')[1]);
        }
      }

      const total = hits + misses;
      const hitRate = total > 0 ? (hits / total) * 100 : 0;

      return {
        hitRate: Math.round(hitRate * 100) / 100,
        evictions,
        memoryUsage: Math.round(memoryUsage / 1024 / 1024), // Convert to MB
      };
    } catch (error) {
      this.logger.error('Error getting cache metrics:', error);
      return { hitRate: 0, evictions: 0, memoryUsage: 0 };
    }
  }

  /**
   * Check alerts based on current metrics
   */
  private async checkAlerts(metrics: SystemMetrics): Promise<Alert[]> {
    const triggeredAlerts: Alert[] = [];
    const now = Date.now();

    for (const rule of this.alertRules) {
      if (!rule.enabled) continue;

      // Check cooldown
      if (
        rule.lastTriggered &&
        now - rule.lastTriggered < rule.cooldown * 60 * 1000
      ) {
        continue;
      }

      const value = this.getMetricValue(metrics, rule.metric);
      if (value === null) continue;

      let triggered = false;
      switch (rule.operator) {
        case '>':
          triggered = value > rule.threshold;
          break;
        case '<':
          triggered = value < rule.threshold;
          break;
        case '>=':
          triggered = value >= rule.threshold;
          break;
        case '<=':
          triggered = value <= rule.threshold;
          break;
        case '=':
          triggered = value === rule.threshold;
          break;
      }

      if (triggered) {
        const alert: Alert = {
          id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          ruleId: rule.id,
          ruleName: rule.name,
          message: `${rule.name}: ${value} ${rule.operator} ${rule.threshold}`,
          severity: rule.severity,
          value,
          threshold: rule.threshold,
          timestamp: now,
          acknowledged: false,
        };

        triggeredAlerts.push(alert);
        rule.lastTriggered = now;

        this.logger.warn(`Alert triggered: ${alert.message}`);
      }
    }

    // Save alerts to Redis
    if (triggeredAlerts.length > 0) {
      const existingAlerts = await this.getActiveAlerts();
      const allAlerts = [...existingAlerts, ...triggeredAlerts];
      await this.redisService.setJson(
        'analytics:alerts:active',
        allAlerts,
        86400,
      );
    }

    return triggeredAlerts;
  }

  /**
   * Get metric value from nested object
   */
  private getMetricValue(metrics: SystemMetrics, path: string): number | null {
    try {
      const keys = path.split('.');
      let value: any = metrics;

      for (const key of keys) {
        value = value[key];
        if (value === undefined || value === null) {
          return null;
        }
      }

      return typeof value === 'number' ? value : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get dashboard data
   */
  async getDashboardData(): Promise<DashboardData> {
    try {
      const metrics = await this.collectSystemMetrics();
      const alerts = await this.getActiveAlerts();
      const trends = await this.getTrends();

      // Calculate overall system status
      let overallStatus: 'HEALTHY' | 'WARNING' | 'CRITICAL' = 'HEALTHY';

      if (alerts.some((a) => a.severity === 'CRITICAL' && !a.acknowledged)) {
        overallStatus = 'CRITICAL';
      } else if (alerts.some((a) => a.severity === 'HIGH' && !a.acknowledged)) {
        overallStatus = 'CRITICAL';
      } else if (
        alerts.some(
          (a) =>
            (a.severity === 'MEDIUM' || a.severity === 'LOW') &&
            !a.acknowledged,
        )
      ) {
        overallStatus = 'WARNING';
      }

      // Calculate uptime
      const uptime = Math.floor((Date.now() - this.systemStartTime) / 1000);

      return {
        overview: {
          status: overallStatus,
          uptime,
          totalRequests: metrics.security.totalRequests,
          activeUsers: 150, // Mock value
          errorRate: metrics.performance.errorRate,
          responseTime: metrics.performance.responseTime,
        },
        metrics,
        alerts: alerts.slice(0, 10), // Latest 10 alerts
        trends,
        services: {
          database: {
            status: metrics.database.status,
            responseTime: metrics.database.avgResponseTime,
          },
          redis: {
            status: 'HEALTHY',
            memoryUsage: metrics.cache.memoryUsage,
          },
          security: {
            status:
              metrics.security.blockedRequests > 50 ? 'WARNING' : 'HEALTHY',
            threatsBlocked: metrics.security.blockedRequests,
          },
          circuitBreakers: {
            status:
              metrics.circuitBreakers.openCircuits > 0 ? 'WARNING' : 'HEALTHY',
            openCircuits: metrics.circuitBreakers.openCircuits,
          },
        },
      };
    } catch (error) {
      this.logger.error('Error getting dashboard data:', error);
      throw error;
    }
  }

  /**
   * Get performance trends
   */
  private async getTrends(): Promise<{
    requestsLastHour: number[];
    responseTimeLastHour: number[];
    errorRateLastHour: number[];
  }> {
    try {
      const lastHourMetrics = this.metricHistory.slice(-60); // Last 60 minutes

      return {
        requestsLastHour: lastHourMetrics.map(
          (m) => m.performance.requestsPerSecond,
        ),
        responseTimeLastHour: lastHourMetrics.map(
          (m) => m.performance.responseTime,
        ),
        errorRateLastHour: lastHourMetrics.map((m) => m.performance.errorRate),
      };
    } catch (error) {
      this.logger.error('Error getting trends:', error);
      return {
        requestsLastHour: [],
        responseTimeLastHour: [],
        errorRateLastHour: [],
      };
    }
  }

  /**
   * Get active alerts
   */
  async getActiveAlerts(): Promise<Alert[]> {
    try {
      const alerts = await this.redisService.getJson<Alert[]>(
        'analytics:alerts:active',
      );
      return alerts || [];
    } catch (error) {
      this.logger.error('Error getting active alerts:', error);
      return [];
    }
  }

  /**
   * Acknowledge alert
   */
  async acknowledgeAlert(
    alertId: string,
    acknowledgedBy: string,
  ): Promise<boolean> {
    try {
      const alerts = await this.getActiveAlerts();
      const alertIndex = alerts.findIndex((a) => a.id === alertId);

      if (alertIndex === -1) {
        return false;
      }

      alerts[alertIndex].acknowledged = true;
      alerts[alertIndex].acknowledgedBy = acknowledgedBy;
      alerts[alertIndex].acknowledgedAt = Date.now();

      await this.redisService.setJson('analytics:alerts:active', alerts, 86400);

      this.logger.log(`Alert ${alertId} acknowledged by ${acknowledgedBy}`);
      return true;
    } catch (error) {
      this.logger.error('Error acknowledging alert:', error);
      return false;
    }
  }

  /**
   * Clear old alerts
   */
  async clearOldAlerts(): Promise<number> {
    try {
      const alerts = await this.getActiveAlerts();
      const cutoff = Date.now() - 24 * 60 * 60 * 1000; // 24 hours ago

      const activeAlerts = alerts.filter(
        (alert) =>
          alert.timestamp > cutoff &&
          (!alert.acknowledged || alert.severity === 'CRITICAL'),
      );

      await this.redisService.setJson(
        'analytics:alerts:active',
        activeAlerts,
        86400,
      );

      const cleared = alerts.length - activeAlerts.length;
      if (cleared > 0) {
        this.logger.log(`Cleared ${cleared} old alerts`);
      }

      return cleared;
    } catch (error) {
      this.logger.error('Error clearing old alerts:', error);
      return 0;
    }
  }

  /**
   * Get system health summary
   */
  async getHealthSummary(): Promise<{
    status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
    score: number;
    issues: string[];
    recommendations: string[];
  }> {
    try {
      const metrics = await this.collectSystemMetrics();
      const alerts = await this.getActiveAlerts();

      let score = 100;
      const issues: string[] = [];
      const recommendations: string[] = [];

      // Deduct points based on metrics
      if (metrics.performance.cpu > 80) {
        score -= 15;
        issues.push(`High CPU usage: ${metrics.performance.cpu}%`);
        recommendations.push('Consider scaling up CPU resources');
      }

      if (metrics.performance.memory > 85) {
        score -= 20;
        issues.push(`High memory usage: ${metrics.performance.memory}%`);
        recommendations.push('Optimize memory usage or increase RAM');
      }

      if (metrics.performance.errorRate > 5) {
        score -= 25;
        issues.push(`High error rate: ${metrics.performance.errorRate}%`);
        recommendations.push('Investigate and fix error causes');
      }

      if (metrics.database.status !== 'HEALTHY') {
        score -= 20;
        issues.push(`Database performance issues: ${metrics.database.status}`);
        recommendations.push('Optimize database queries and indexes');
      }

      if (metrics.circuitBreakers.openCircuits > 0) {
        score -= 30;
        issues.push(
          `${metrics.circuitBreakers.openCircuits} circuit breakers open`,
        );
        recommendations.push('Check external service dependencies');
      }

      // Deduct points for unacknowledged alerts
      const criticalAlerts = alerts.filter(
        (a) => a.severity === 'CRITICAL' && !a.acknowledged,
      );
      const highAlerts = alerts.filter(
        (a) => a.severity === 'HIGH' && !a.acknowledged,
      );

      score -= criticalAlerts.length * 20;
      score -= highAlerts.length * 10;

      score = Math.max(score, 0);

      let status: 'HEALTHY' | 'WARNING' | 'CRITICAL' = 'HEALTHY';
      if (score < 60 || criticalAlerts.length > 0) {
        status = 'CRITICAL';
      } else if (score < 80 || highAlerts.length > 0) {
        status = 'WARNING';
      }

      return { status, score, issues, recommendations };
    } catch (error) {
      this.logger.error('Error getting health summary:', error);
      return {
        status: 'CRITICAL',
        score: 0,
        issues: ['Error calculating health summary'],
        recommendations: ['Check system logs for errors'],
      };
    }
  }

  /**
   * Scheduled metrics collection
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async scheduledMetricsCollection(): Promise<void> {
    try {
      const metrics = await this.collectSystemMetrics();
      await this.checkAlerts(metrics);
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
      await this.clearOldAlerts();

      // Keep only last 24 hours of metrics
      if (this.metricHistory.length > 1440) {
        this.metricHistory = this.metricHistory.slice(-1440);
      }

      this.logger.log('Analytics dashboard cleanup completed');
    } catch (error) {
      this.logger.error('Error in scheduled cleanup:', error);
    }
  }

  /**
   * Export dashboard data for external monitoring
   */
  async exportMetrics(): Promise<{
    timestamp: number;
    metrics: SystemMetrics;
    health: {
      status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
      score: number;
      issues: string[];
      recommendations: string[];
    };
    alerts: Alert[];
  }> {
    return {
      timestamp: Date.now(),
      metrics: await this.collectSystemMetrics(),
      health: await this.getHealthSummary(),
      alerts: await this.getActiveAlerts(),
    };
  }
}
