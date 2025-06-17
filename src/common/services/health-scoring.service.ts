import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import Redis from 'ioredis';

interface HealthMetric {
  name: string;
  value: number;
  threshold: number;
  weight: number;
  status: 'healthy' | 'warning' | 'critical';
  lastCheck: Date;
  trend: 'improving' | 'stable' | 'degrading';
}

interface HealthScore {
  overall: number;
  grade: 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C' | 'D' | 'F';
  status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  timestamp: Date;
  details: {
    performance: number;
    security: number;
    reliability: number;
    scalability: number;
  };
  recommendations: string[];
}

interface AlertRule {
  id: string;
  name: string;
  metric: string;
  condition: 'gt' | 'lt' | 'eq' | 'ne';
  threshold: number;
  severity: 'info' | 'warning' | 'critical';
  enabled: boolean;
  recipients: string[];
  cooldown: number; // minutes
  lastTriggered?: Date;
}

@Injectable()
export class HealthScoringService implements OnModuleInit {
  private readonly logger = new Logger(HealthScoringService.name);
  private redis: Redis;
  private metrics = new Map<string, HealthMetric>();
  private alertRules = new Map<string, AlertRule>();
  private currentScore: HealthScore;
  private scoringInterval: NodeJS.Timeout;

  constructor(
    private configService: ConfigService,
    private eventEmitter: EventEmitter2,
  ) {
    this.setupRedisConnection();
    this.initializeMetrics();
    this.setupDefaultAlertRules();
  }

  async onModuleInit() {
    this.logger.log('💊 Initializing Health Scoring Service...');
    await this.loadMetrics();
    this.startContinuousScoring();
    this.logger.log('✅ Health Scoring Service initialized');
  }

  /**
   * Setup Redis connection
   */
  private setupRedisConnection(): void {
    const disableRedis = this.configService.get<boolean>('DISABLE_REDIS');

    if (disableRedis) {
      this.logger.warn(
        '🚫 Redis is disabled via DISABLE_REDIS flag - using mock health storage',
      );
      // Create a mock Redis client with proper method implementations
      this.redis = new Proxy({} as Redis, {
        get: (target, prop) => {
          // Handle specific methods that need special return values
          if (prop === 'get') {
            return () => Promise.resolve(null);
          }
          if (prop === 'mget') {
            return () => Promise.resolve([]);
          }
          if (prop === 'keys') {
            return () => Promise.resolve([]);
          }
          if (prop === 'hgetall') {
            return () => Promise.resolve({});
          }
          if (prop === 'lrange') {
            return () => Promise.resolve([]);
          }
          if (prop === 'exists') {
            return () => Promise.resolve(0);
          }
          if (prop === 'ttl') {
            return () => Promise.resolve(-1);
          }
          // For all other methods, return OK or success
          return () => Promise.resolve('OK');
        },
      });
      return;
    }

    const redisUrl = this.configService.get(
      'REDIS_URL',
      'redis://localhost:6379',
    );

    this.redis = new Redis(redisUrl, {
      keyPrefix: 'iccautotravel:health:',
      maxRetriesPerRequest: 3,
    });

    this.redis.on('error', (error) => {
      this.logger.error('❌ Redis health connection error:', error);
    });
  }

  /**
   * Initialize health metrics
   */
  private initializeMetrics(): void {
    const metrics: HealthMetric[] = [
      // Performance Metrics
      {
        name: 'cpu_usage',
        value: 0,
        threshold: 80,
        weight: 20,
        status: 'healthy',
        lastCheck: new Date(),
        trend: 'stable',
      },
      {
        name: 'memory_usage',
        value: 0,
        threshold: 85,
        weight: 20,
        status: 'healthy',
        lastCheck: new Date(),
        trend: 'stable',
      },
      {
        name: 'response_time',
        value: 0,
        threshold: 500, // milliseconds
        weight: 25,
        status: 'healthy',
        lastCheck: new Date(),
        trend: 'stable',
      },
      {
        name: 'throughput',
        value: 0,
        threshold: 1000, // requests per minute
        weight: 15,
        status: 'healthy',
        lastCheck: new Date(),
        trend: 'stable',
      },

      // Security Metrics
      {
        name: 'failed_logins',
        value: 0,
        threshold: 50, // per hour
        weight: 15,
        status: 'healthy',
        lastCheck: new Date(),
        trend: 'stable',
      },
      {
        name: 'security_violations',
        value: 0,
        threshold: 10, // per hour
        weight: 20,
        status: 'healthy',
        lastCheck: new Date(),
        trend: 'stable',
      },

      // Reliability Metrics
      {
        name: 'error_rate',
        value: 0,
        threshold: 1, // percentage
        weight: 25,
        status: 'healthy',
        lastCheck: new Date(),
        trend: 'stable',
      },
      {
        name: 'uptime',
        value: 100,
        threshold: 99.9, // percentage
        weight: 30,
        status: 'healthy',
        lastCheck: new Date(),
        trend: 'stable',
      },

      // Database Metrics
      {
        name: 'db_connections',
        value: 0,
        threshold: 80, // percentage of pool
        weight: 15,
        status: 'healthy',
        lastCheck: new Date(),
        trend: 'stable',
      },
      {
        name: 'db_query_time',
        value: 0,
        threshold: 100, // milliseconds
        weight: 20,
        status: 'healthy',
        lastCheck: new Date(),
        trend: 'stable',
      },

      // Cache Metrics
      {
        name: 'cache_hit_rate',
        value: 95,
        threshold: 80, // percentage
        weight: 10,
        status: 'healthy',
        lastCheck: new Date(),
        trend: 'stable',
      },
    ];

    metrics.forEach((metric) => {
      this.metrics.set(metric.name, metric);
    });

    this.logger.log(`🔍 Initialized ${metrics.length} health metrics`);
  }

  /**
   * Setup default alert rules
   */
  private setupDefaultAlertRules(): void {
    const alertRules: AlertRule[] = [
      {
        id: 'high_cpu',
        name: 'High CPU Usage',
        metric: 'cpu_usage',
        condition: 'gt',
        threshold: 90,
        severity: 'critical',
        enabled: true,
        recipients: ['admin@iccautotravel.com'],
        cooldown: 10,
      },
      {
        id: 'high_memory',
        name: 'High Memory Usage',
        metric: 'memory_usage',
        condition: 'gt',
        threshold: 90,
        severity: 'critical',
        enabled: true,
        recipients: ['admin@iccautotravel.com'],
        cooldown: 10,
      },
      {
        id: 'slow_response',
        name: 'Slow Response Time',
        metric: 'response_time',
        condition: 'gt',
        threshold: 1000,
        severity: 'warning',
        enabled: true,
        recipients: ['dev@iccautotravel.com'],
        cooldown: 5,
      },
      {
        id: 'high_error_rate',
        name: 'High Error Rate',
        metric: 'error_rate',
        condition: 'gt',
        threshold: 5,
        severity: 'critical',
        enabled: true,
        recipients: ['admin@iccautotravel.com', 'dev@iccautotravel.com'],
        cooldown: 15,
      },
      {
        id: 'security_breach',
        name: 'Security Violations',
        metric: 'security_violations',
        condition: 'gt',
        threshold: 20,
        severity: 'critical',
        enabled: true,
        recipients: ['security@iccautotravel.com', 'admin@iccautotravel.com'],
        cooldown: 5,
      },
      {
        id: 'low_uptime',
        name: 'Low Uptime',
        metric: 'uptime',
        condition: 'lt',
        threshold: 99.5,
        severity: 'critical',
        enabled: true,
        recipients: ['admin@iccautotravel.com'],
        cooldown: 30,
      },
    ];

    alertRules.forEach((rule) => {
      this.alertRules.set(rule.id, rule);
    });

    this.logger.log(`🚨 Setup ${alertRules.length} alert rules`);
  }

  /**
   * Load metrics from external sources
   */
  private async loadMetrics(): Promise<void> {
    try {
      // Load from Redis if available
      const storedMetrics = await this.redis.hgetall('metrics');

      for (const [name, data] of Object.entries(storedMetrics)) {
        const metric = JSON.parse(data);
        if (this.metrics.has(name)) {
          this.metrics.set(name, { ...this.metrics.get(name)!, ...metric });
        }
      }

      this.logger.log('📊 Loaded metrics from storage');
    } catch (error) {
      this.logger.warn('⚠️ Could not load stored metrics:', error);
    }
  }

  /**
   * Start continuous scoring
   */
  private startContinuousScoring(): void {
    // Score every 30 seconds
    this.scoringInterval = setInterval(async () => {
      await this.collectMetrics();
      await this.calculateHealthScore();
      await this.checkAlerts();
    }, 30000);

    this.logger.log('🔄 Started continuous health scoring');
  }

  /**
   * Collect metrics from system
   */
  private async collectMetrics(): Promise<void> {
    try {
      // Simulate metric collection (in real implementation, gather from monitoring systems)
      this.updateMetric('cpu_usage', Math.random() * 100);
      this.updateMetric('memory_usage', Math.random() * 100);
      this.updateMetric('response_time', Math.random() * 1000);
      this.updateMetric('throughput', Math.random() * 2000);
      this.updateMetric('error_rate', Math.random() * 5);
      this.updateMetric('uptime', 99.5 + Math.random() * 0.5);
      this.updateMetric('db_connections', Math.random() * 100);
      this.updateMetric('db_query_time', Math.random() * 200);
      this.updateMetric('cache_hit_rate', 80 + Math.random() * 20);
      this.updateMetric('failed_logins', Math.random() * 20);
      this.updateMetric('security_violations', Math.random() * 5);

      // Store metrics in Redis
      const metricsData: Record<string, string> = {};
      for (const [name, metric] of this.metrics.entries()) {
        metricsData[name] = JSON.stringify(metric);
      }
      await this.redis.hmset('metrics', metricsData);
    } catch (error) {
      this.logger.error('❌ Error collecting metrics:', error);
    }
  }

  /**
   * Update metric value
   */
  private updateMetric(name: string, value: number): void {
    const metric = this.metrics.get(name);
    if (!metric) return;

    const previousValue = metric.value;
    metric.value = value;
    metric.lastCheck = new Date();

    // Determine status
    if (name === 'uptime' || name === 'cache_hit_rate') {
      // Higher is better
      if (value >= metric.threshold) {
        metric.status = 'healthy';
      } else if (value >= metric.threshold * 0.9) {
        metric.status = 'warning';
      } else {
        metric.status = 'critical';
      }
    } else {
      // Lower is better
      if (value <= metric.threshold) {
        metric.status = 'healthy';
      } else if (value <= metric.threshold * 1.5) {
        metric.status = 'warning';
      } else {
        metric.status = 'critical';
      }
    }

    // Determine trend
    if (Math.abs(value - previousValue) < previousValue * 0.05) {
      metric.trend = 'stable';
    } else if (name === 'uptime' || name === 'cache_hit_rate') {
      metric.trend = value > previousValue ? 'improving' : 'degrading';
    } else {
      metric.trend = value < previousValue ? 'improving' : 'degrading';
    }

    this.metrics.set(name, metric);
  }

  /**
   * Calculate overall health score
   */
  private async calculateHealthScore(): Promise<void> {
    let totalScore = 0;
    let totalWeight = 0;

    const categoryScores = {
      performance: 0,
      security: 0,
      reliability: 0,
      scalability: 0,
    };

    const categoryWeights = {
      performance: 0,
      security: 0,
      reliability: 0,
      scalability: 0,
    };

    for (const metric of this.metrics.values()) {
      let score = 0;

      // Calculate score based on status
      switch (metric.status) {
        case 'healthy':
          score = 100;
          break;
        case 'warning':
          score = 70;
          break;
        case 'critical':
          score = 30;
          break;
      }

      // Apply trend bonus/penalty
      switch (metric.trend) {
        case 'improving':
          score += 5;
          break;
        case 'degrading':
          score -= 10;
          break;
      }

      score = Math.max(0, Math.min(100, score));

      totalScore += score * metric.weight;
      totalWeight += metric.weight;

      // Categorize metrics
      if (
        ['cpu_usage', 'memory_usage', 'response_time', 'throughput'].includes(
          metric.name,
        )
      ) {
        categoryScores.performance += score * metric.weight;
        categoryWeights.performance += metric.weight;
      } else if (
        ['failed_logins', 'security_violations'].includes(metric.name)
      ) {
        categoryScores.security += score * metric.weight;
        categoryWeights.security += metric.weight;
      } else if (['error_rate', 'uptime'].includes(metric.name)) {
        categoryScores.reliability += score * metric.weight;
        categoryWeights.reliability += metric.weight;
      } else {
        categoryScores.scalability += score * metric.weight;
        categoryWeights.scalability += metric.weight;
      }
    }

    const overallScore =
      totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;

    // Calculate category scores
    for (const [category, weight] of Object.entries(categoryWeights)) {
      if (weight > 0) {
        categoryScores[category as keyof typeof categoryScores] = Math.round(
          categoryScores[category as keyof typeof categoryScores] / weight,
        );
      }
    }

    // Determine grade and status
    let grade: HealthScore['grade'];
    let status: HealthScore['status'];

    if (overallScore >= 95) {
      grade = 'A+';
      status = 'excellent';
    } else if (overallScore >= 90) {
      grade = 'A';
      status = 'excellent';
    } else if (overallScore >= 85) {
      grade = 'A-';
      status = 'good';
    } else if (overallScore >= 80) {
      grade = 'B+';
      status = 'good';
    } else if (overallScore >= 75) {
      grade = 'B';
      status = 'fair';
    } else if (overallScore >= 70) {
      grade = 'B-';
      status = 'fair';
    } else if (overallScore >= 60) {
      grade = 'C';
      status = 'poor';
    } else if (overallScore >= 50) {
      grade = 'D';
      status = 'poor';
    } else {
      grade = 'F';
      status = 'critical';
    }

    this.currentScore = {
      overall: overallScore,
      grade,
      status,
      timestamp: new Date(),
      details: categoryScores,
      recommendations: this.generateRecommendations(),
    };

    // Store score
    await this.redis.setex(
      'health_score',
      300,
      JSON.stringify(this.currentScore),
    );

    // Emit event
    this.eventEmitter.emit('health.score_updated', this.currentScore);
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    for (const metric of this.metrics.values()) {
      if (metric.status === 'critical') {
        switch (metric.name) {
          case 'cpu_usage':
            recommendations.push(
              'High CPU usage detected. Consider scaling horizontally or optimizing CPU-intensive operations.',
            );
            break;
          case 'memory_usage':
            recommendations.push(
              'High memory usage detected. Review memory leaks or increase available memory.',
            );
            break;
          case 'response_time':
            recommendations.push(
              'Slow response times detected. Optimize database queries and implement caching.',
            );
            break;
          case 'error_rate':
            recommendations.push(
              'High error rate detected. Review error logs and fix critical issues.',
            );
            break;
          case 'security_violations':
            recommendations.push(
              'Security violations detected. Review access logs and strengthen security measures.',
            );
            break;
          case 'uptime':
            recommendations.push(
              'Low uptime detected. Investigate system stability and implement redundancy.',
            );
            break;
        }
      }
    }

    if (this.currentScore?.overall < 80) {
      recommendations.push(
        'Overall health score is low. Focus on addressing critical metrics first.',
      );
    }

    return recommendations;
  }

  /**
   * Check alerts
   */
  private async checkAlerts(): Promise<void> {
    for (const rule of this.alertRules.values()) {
      if (!rule.enabled) continue;

      const metric = this.metrics.get(rule.metric);
      if (!metric) continue;

      let triggered = false;

      switch (rule.condition) {
        case 'gt':
          triggered = metric.value > rule.threshold;
          break;
        case 'lt':
          triggered = metric.value < rule.threshold;
          break;
        case 'eq':
          triggered = metric.value === rule.threshold;
          break;
        case 'ne':
          triggered = metric.value !== rule.threshold;
          break;
      }

      if (triggered && this.shouldTriggerAlert(rule)) {
        await this.triggerAlert(rule, metric);
      }
    }
  }

  /**
   * Check if alert should be triggered (cooldown)
   */
  private shouldTriggerAlert(rule: AlertRule): boolean {
    if (!rule.lastTriggered) return true;

    const cooldownMs = rule.cooldown * 60 * 1000;
    return Date.now() - rule.lastTriggered.getTime() > cooldownMs;
  }

  /**
   * Trigger alert
   */
  private async triggerAlert(
    rule: AlertRule,
    metric: HealthMetric,
  ): Promise<void> {
    rule.lastTriggered = new Date();
    this.alertRules.set(rule.id, rule);

    const alert = {
      id: this.generateId(),
      ruleId: rule.id,
      name: rule.name,
      metric: metric.name,
      value: metric.value,
      threshold: rule.threshold,
      severity: rule.severity,
      timestamp: new Date(),
      recipients: rule.recipients,
    };

    // Store alert
    await this.redis.lpush('alerts', JSON.stringify(alert));
    await this.redis.ltrim('alerts', 0, 999); // Keep last 1000 alerts

    // Emit event
    this.eventEmitter.emit('health.alert_triggered', alert);

    this.logger.warn(
      `🚨 Alert triggered: ${rule.name} - ${metric.name}: ${metric.value}`,
    );
  }

  /**
   * Get current health score
   */
  getCurrentHealthScore(): HealthScore | null {
    return this.currentScore;
  }

  /**
   * Get health metrics
   */
  getHealthMetrics(): HealthMetric[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Get health trend
   */
  async getHealthTrend(timeRange: string = '24h'): Promise<any[]> {
    try {
      // In real implementation, query historical data
      return [];
    } catch (error) {
      this.logger.error('❌ Error getting health trend:', error);
      return [];
    }
  }

  /**
   * Get recent alerts
   */
  async getRecentAlerts(limit: number = 50): Promise<any[]> {
    try {
      const alertsData = await this.redis.lrange('alerts', 0, limit - 1);
      return alertsData.map((data) => JSON.parse(data));
    } catch (error) {
      this.logger.error('❌ Error getting recent alerts:', error);
      return [];
    }
  }

  /**
   * Add custom metric
   */
  addCustomMetric(name: string, metric: Partial<HealthMetric>): void {
    const defaultMetric: HealthMetric = {
      name,
      value: 0,
      threshold: 100,
      weight: 10,
      status: 'healthy',
      lastCheck: new Date(),
      trend: 'stable',
      ...metric,
    };

    this.metrics.set(name, defaultMetric);
    this.logger.log(`➕ Added custom metric: ${name}`);
  }

  /**
   * Add alert rule
   */
  addAlertRule(rule: AlertRule): void {
    this.alertRules.set(rule.id, rule);
    this.logger.log(`➕ Added alert rule: ${rule.name}`);
  }

  /**
   * Update alert rule
   */
  updateAlertRule(id: string, updates: Partial<AlertRule>): void {
    const rule = this.alertRules.get(id);
    if (rule) {
      this.alertRules.set(id, { ...rule, ...updates });
      this.logger.log(`📝 Updated alert rule: ${id}`);
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get health dashboard data
   */
  getHealthDashboard(): {
    score: HealthScore | null;
    metrics: HealthMetric[];
    criticalMetrics: HealthMetric[];
    recommendations: string[];
  } {
    const criticalMetrics = Array.from(this.metrics.values())
      .filter((metric) => metric.status === 'critical')
      .sort((a, b) => b.weight - a.weight);

    return {
      score: this.currentScore,
      metrics: this.getHealthMetrics(),
      criticalMetrics,
      recommendations: this.currentScore?.recommendations || [],
    };
  }

  /**
   * Force health check
   */
  async forceHealthCheck(): Promise<void> {
    this.logger.log('🔍 Forcing health check...');
    await this.collectMetrics();
    await this.calculateHealthScore();
    await this.checkAlerts();
    this.logger.log('✅ Health check completed');
  }

  /**
   * Shutdown service
   */
  async shutdown(): Promise<void> {
    if (this.scoringInterval) {
      clearInterval(this.scoringInterval);
    }

    await this.redis.quit();
    this.logger.log('🛑 Health Scoring Service shutdown');
  }
}
