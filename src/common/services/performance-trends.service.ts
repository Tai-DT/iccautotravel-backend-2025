import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import Redis from 'ioredis';

interface PerformanceDataPoint {
  timestamp: Date;
  metric: string;
  value: number;
  category: 'system' | 'application' | 'database' | 'cache' | 'network';
  metadata?: Record<string, any>;
}

interface TrendAnalysis {
  metric: string;
  timeRange: string;
  direction: 'up' | 'down' | 'stable';
  changePercentage: number;
  significance: 'low' | 'medium' | 'high' | 'critical';
  dataPoints: PerformanceDataPoint[];
  prediction: {
    nextHour: number;
    nextDay: number;
    confidence: number;
  };
  anomalies: Array<{
    timestamp: Date;
    expectedValue: number;
    actualValue: number;
    severity: 'low' | 'medium' | 'high';
  }>;
}

interface PerformanceAlert {
  id: string;
  metric: string;
  type: 'threshold' | 'anomaly' | 'trend';
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  timestamp: Date;
  value: number;
  threshold?: number;
  resolved: boolean;
}

interface PerformanceReport {
  generatedAt: Date;
  timeRange: string;
  summary: {
    overallHealth: number;
    criticalAlerts: number;
    improvingMetrics: number;
    degradingMetrics: number;
  };
  trends: TrendAnalysis[];
  alerts: PerformanceAlert[];
  recommendations: string[];
  keyInsights: string[];
}

@Injectable()
export class PerformanceTrendsService implements OnModuleInit {
  private readonly logger = new Logger(PerformanceTrendsService.name);
  private redis: Redis;
  private dataPoints = new Map<string, PerformanceDataPoint[]>();
  private alerts = new Map<string, PerformanceAlert>();
  private thresholds = new Map<string, { warning: number; critical: number }>();

  constructor(
    private configService: ConfigService,
    private eventEmitter: EventEmitter2,
  ) {
    this.setupRedisConnection();
    this.setupDefaultThresholds();
  }

  async onModuleInit() {
    this.logger.log('📈 Initializing Performance Trends Service...');
    this.setupEventListeners();
    await this.loadHistoricalData();
    this.startTrendAnalysis();
    this.logger.log('✅ Performance Trends Service initialized');
  }

  /**
   * Setup Redis connection
   */
  private setupRedisConnection(): void {
    const disableRedis = this.configService.get<boolean>('DISABLE_REDIS');

    if (disableRedis) {
      this.logger.warn(
        '🚫 Redis is disabled via DISABLE_REDIS flag - using mock trends storage',
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
      keyPrefix: 'iccautotravel:trends:',
      maxRetriesPerRequest: 3,
    });
  }

  /**
   * Setup default performance thresholds
   */
  private setupDefaultThresholds(): void {
    this.thresholds.set('cpu_usage', { warning: 70, critical: 90 });
    this.thresholds.set('memory_usage', { warning: 80, critical: 95 });
    this.thresholds.set('response_time', { warning: 1000, critical: 3000 });
    this.thresholds.set('error_rate', { warning: 2, critical: 5 });
    this.thresholds.set('database_response_time', {
      warning: 500,
      critical: 1500,
    });
    this.thresholds.set('cache_hit_rate', { warning: 70, critical: 50 });
    this.thresholds.set('disk_usage', { warning: 80, critical: 95 });
    this.thresholds.set('network_latency', { warning: 100, critical: 300 });

    this.logger.log(`⚙️ Setup ${this.thresholds.size} performance thresholds`);
  }

  /**
   * Setup event listeners for performance data collection
   */
  private setupEventListeners(): void {
    // Listen for various performance metrics
    this.eventEmitter.on('metrics.collected', (data) => {
      this.recordSystemMetrics(data);
    });

    this.eventEmitter.on('request.completed', (data) => {
      this.recordMetric(
        'response_time',
        data.responseTime,
        'application',
        data,
      );
    });

    this.eventEmitter.on('database.query', (data) => {
      this.recordMetric(
        'database_response_time',
        data.duration,
        'database',
        data,
      );
    });

    this.eventEmitter.on('cache.metrics_updated', (data) => {
      this.recordMetric('cache_hit_rate', data.hitRate, 'cache', data);
    });

    this.eventEmitter.on('error.occurred', (data) => {
      this.recordErrorMetric(data);
    });

    this.logger.log('👂 Event listeners setup for performance tracking');
  }

  /**
   * Record a performance metric
   */
  async recordMetric(
    metric: string,
    value: number,
    category: 'system' | 'application' | 'database' | 'cache' | 'network',
    metadata?: Record<string, any>,
  ): Promise<void> {
    const dataPoint: PerformanceDataPoint = {
      timestamp: new Date(),
      metric,
      value,
      category,
      metadata,
    };

    // Store in memory
    if (!this.dataPoints.has(metric)) {
      this.dataPoints.set(metric, []);
    }

    const points = this.dataPoints.get(metric)!;
    points.push(dataPoint);

    // Keep only last 1000 points per metric
    if (points.length > 1000) {
      points.shift();
    }

    // Store in Redis for persistence
    await this.persistDataPoint(dataPoint);

    // Check thresholds
    await this.checkThresholds(metric, value, dataPoint);

    // Emit event for real-time monitoring
    this.eventEmitter.emit('performance.metric_recorded', dataPoint);
  }

  /**
   * Record system metrics from monitoring service
   */
  private async recordSystemMetrics(systemData: any): Promise<void> {
    if (systemData.cpu) {
      await this.recordMetric('cpu_usage', systemData.cpu.usage, 'system');
    }

    if (systemData.memory) {
      await this.recordMetric(
        'memory_usage',
        systemData.memory.percentage,
        'system',
      );
    }

    if (systemData.disk) {
      await this.recordMetric(
        'disk_usage',
        systemData.disk.percentage,
        'system',
      );
    }

    if (systemData.application) {
      await this.recordMetric(
        'error_rate',
        systemData.application.errorRate,
        'application',
      );
    }
  }

  /**
   * Record error metrics
   */
  private async recordErrorMetric(errorData: any): Promise<void> {
    // Calculate error rate based on recent requests
    const recentPoints = this.getRecentDataPoints('response_time', 300); // Last 5 minutes
    const totalRequests = recentPoints.length;
    const errorRate = totalRequests > 0 ? (1 / totalRequests) * 100 : 0;

    await this.recordMetric('error_rate', errorRate, 'application', errorData);
  }

  /**
   * Persist data point to Redis
   */
  private async persistDataPoint(
    dataPoint: PerformanceDataPoint,
  ): Promise<void> {
    try {
      const key = `data:${dataPoint.metric}`;
      const value = JSON.stringify(dataPoint);

      // Add to sorted set with timestamp as score
      await this.redis.zadd(key, dataPoint.timestamp.getTime(), value);

      // Keep only last 24 hours of data
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      await this.redis.zremrangebyscore(key, 0, oneDayAgo);

      // Set expiration for the key
      await this.redis.expire(key, 86400 * 7); // 7 days
    } catch (error) {
      this.logger.error('❌ Error persisting data point:', error);
    }
  }

  /**
   * Load historical data from Redis
   */
  private async loadHistoricalData(): Promise<void> {
    try {
      const keys = await this.redis.keys('data:*');
      let totalLoaded = 0;

      for (const key of keys) {
        const metric = key.replace('data:', '');
        const data = await this.redis.zrange(key, 0, -1);

        const points: PerformanceDataPoint[] = data.map((item) =>
          JSON.parse(item),
        );
        this.dataPoints.set(metric, points);
        totalLoaded += points.length;
      }

      this.logger.log(
        `📊 Loaded ${totalLoaded} historical data points for ${keys.length} metrics`,
      );
    } catch (error) {
      this.logger.error('❌ Error loading historical data:', error);
    }
  }

  /**
   * Check performance thresholds
   */
  private async checkThresholds(
    metric: string,
    value: number,
    dataPoint: PerformanceDataPoint,
  ): Promise<void> {
    const threshold = this.thresholds.get(metric);
    if (!threshold) return;

    let alertLevel: 'warning' | 'critical' | null = null;

    if (value >= threshold.critical) {
      alertLevel = 'critical';
    } else if (value >= threshold.warning) {
      alertLevel = 'warning';
    }

    if (alertLevel) {
      await this.createAlert({
        metric,
        type: 'threshold',
        severity: alertLevel,
        message: `${metric} (${value}) exceeded ${alertLevel} threshold (${threshold[alertLevel]})`,
        value,
        threshold: threshold[alertLevel],
      });
    }
  }

  /**
   * Create performance alert
   */
  private async createAlert(
    alertData: Omit<PerformanceAlert, 'id' | 'timestamp' | 'resolved'>,
  ): Promise<void> {
    const alert: PerformanceAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      resolved: false,
      ...alertData,
    };

    // Check if similar alert already exists
    const existingAlert = Array.from(this.alerts.values()).find(
      (a) => a.metric === alert.metric && a.type === alert.type && !a.resolved,
    );

    if (existingAlert) return; // Avoid duplicate alerts

    this.alerts.set(alert.id, alert);

    this.logger.warn(`🚨 Performance Alert: ${alert.message}`);
    this.eventEmitter.emit('performance.alert_created', alert);

    // Auto-resolve threshold alerts after some time
    if (alert.type === 'threshold') {
      setTimeout(() => {
        this.resolveAlert(alert.id);
      }, 300000); // 5 minutes
    }
  }

  /**
   * Start continuous trend analysis
   */
  private startTrendAnalysis(): void {
    // Run trend analysis every 5 minutes
    setInterval(async () => {
      await this.performTrendAnalysis();
    }, 300000);

    // Run anomaly detection every minute
    setInterval(async () => {
      await this.detectAnomalies();
    }, 60000);

    this.logger.log('📈 Started continuous trend analysis');
  }

  /**
   * Perform comprehensive trend analysis
   */
  private async performTrendAnalysis(): Promise<void> {
    try {
      const metrics = Array.from(this.dataPoints.keys());

      for (const metric of metrics) {
        const analysis = await this.analyzeTrend(metric, '1h');

        // Check for significant trends
        if (
          analysis.significance === 'high' ||
          analysis.significance === 'critical'
        ) {
          await this.createTrendAlert(analysis);
        }
      }
    } catch (error) {
      this.logger.error('❌ Error in trend analysis:', error);
    }
  }

  /**
   * Analyze trend for specific metric
   */
  async analyzeTrend(
    metric: string,
    timeRange: string,
  ): Promise<TrendAnalysis> {
    const dataPoints = this.getRecentDataPoints(
      metric,
      this.getTimeRangeMinutes(timeRange),
    );

    if (dataPoints.length < 2) {
      return this.getDefaultTrendAnalysis(metric, timeRange);
    }

    // Calculate trend direction and change
    const firstValue = dataPoints[0].value;
    const lastValue = dataPoints[dataPoints.length - 1].value;
    const changePercentage = ((lastValue - firstValue) / firstValue) * 100;

    let direction: 'up' | 'down' | 'stable' = 'stable';
    if (Math.abs(changePercentage) > 5) {
      direction = changePercentage > 0 ? 'up' : 'down';
    }

    // Determine significance
    let significance: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (Math.abs(changePercentage) > 50) significance = 'critical';
    else if (Math.abs(changePercentage) > 25) significance = 'high';
    else if (Math.abs(changePercentage) > 10) significance = 'medium';

    // Generate prediction
    const prediction = this.generatePrediction(dataPoints);

    // Detect anomalies
    const anomalies = this.detectMetricAnomalies(dataPoints);

    return {
      metric,
      timeRange,
      direction,
      changePercentage,
      significance,
      dataPoints,
      prediction,
      anomalies,
    };
  }

  /**
   * Generate prediction based on trend
   */
  private generatePrediction(dataPoints: PerformanceDataPoint[]): {
    nextHour: number;
    nextDay: number;
    confidence: number;
  } {
    if (dataPoints.length < 3) {
      const lastValue = dataPoints[dataPoints.length - 1]?.value || 0;
      return {
        nextHour: lastValue,
        nextDay: lastValue,
        confidence: 0.3,
      };
    }

    // Simple linear regression for prediction
    const n = dataPoints.length;
    const x = dataPoints.map((_, i) => i);
    const y = dataPoints.map((dp) => dp.value);

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate R-squared for confidence
    const yMean = sumY / n;
    const ssTotal = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
    const ssRes = y.reduce((sum, yi, i) => {
      const predicted = slope * x[i] + intercept;
      return sum + Math.pow(yi - predicted, 2);
    }, 0);
    const rSquared = 1 - ssRes / ssTotal;

    return {
      nextHour: slope * (n + 1) + intercept,
      nextDay: slope * (n + 24) + intercept,
      confidence: Math.max(0, Math.min(1, rSquared)),
    };
  }

  /**
   * Detect anomalies in metric data
   */
  private detectMetricAnomalies(dataPoints: PerformanceDataPoint[]): Array<{
    timestamp: Date;
    expectedValue: number;
    actualValue: number;
    severity: 'low' | 'medium' | 'high';
  }> {
    if (dataPoints.length < 10) return [];

    const anomalies: Array<{
      timestamp: Date;
      expectedValue: number;
      actualValue: number;
      severity: 'low' | 'medium' | 'high';
    }> = [];

    // Calculate moving average and standard deviation
    const windowSize = Math.min(10, Math.floor(dataPoints.length / 2));

    for (let i = windowSize; i < dataPoints.length; i++) {
      const window = dataPoints.slice(i - windowSize, i);
      const mean =
        window.reduce((sum, dp) => sum + dp.value, 0) / window.length;
      const stdDev = Math.sqrt(
        window.reduce((sum, dp) => sum + Math.pow(dp.value - mean, 2), 0) /
          window.length,
      );

      const currentPoint = dataPoints[i];
      const deviation = Math.abs(currentPoint.value - mean);
      const zScore = stdDev > 0 ? deviation / stdDev : 0;

      // Detect anomalies based on z-score
      if (zScore > 2) {
        let severity: 'low' | 'medium' | 'high' = 'low';
        if (zScore > 4) severity = 'high';
        else if (zScore > 3) severity = 'medium';

        anomalies.push({
          timestamp: currentPoint.timestamp,
          expectedValue: mean,
          actualValue: currentPoint.value,
          severity,
        });
      }
    }

    return anomalies;
  }

  /**
   * Detect anomalies across all metrics
   */
  private async detectAnomalies(): Promise<void> {
    for (const [metric, dataPoints] of this.dataPoints.entries()) {
      const recentPoints = dataPoints.slice(-20); // Last 20 points
      const anomalies = this.detectMetricAnomalies(recentPoints);

      for (const anomaly of anomalies) {
        if (anomaly.severity === 'high') {
          await this.createAlert({
            metric,
            type: 'anomaly',
            severity: 'warning',
            message: `Anomaly detected in ${metric}: expected ${anomaly.expectedValue.toFixed(2)}, got ${anomaly.actualValue.toFixed(2)}`,
            value: anomaly.actualValue,
          });
        }
      }
    }
  }

  /**
   * Create trend-based alert
   */
  private async createTrendAlert(analysis: TrendAnalysis): Promise<void> {
    const severity =
      analysis.significance === 'critical' ? 'critical' : 'warning';
    const direction = analysis.direction === 'up' ? 'increasing' : 'decreasing';

    await this.createAlert({
      metric: analysis.metric,
      type: 'trend',
      severity,
      message: `${analysis.metric} is ${direction} by ${Math.abs(analysis.changePercentage).toFixed(1)}% over ${analysis.timeRange}`,
      value: analysis.dataPoints[analysis.dataPoints.length - 1]?.value || 0,
    });
  }

  /**
   * Get recent data points for a metric
   */
  private getRecentDataPoints(
    metric: string,
    minutes: number,
  ): PerformanceDataPoint[] {
    const points = this.dataPoints.get(metric) || [];
    const cutoffTime = new Date(Date.now() - minutes * 60 * 1000);

    return points.filter((point) => point.timestamp >= cutoffTime);
  }

  /**
   * Convert time range to minutes
   */
  private getTimeRangeMinutes(timeRange: string): number {
    const timeMap: Record<string, number> = {
      '5m': 5,
      '15m': 15,
      '30m': 30,
      '1h': 60,
      '3h': 180,
      '6h': 360,
      '12h': 720,
      '24h': 1440,
    };

    return timeMap[timeRange] || 60;
  }

  /**
   * Get default trend analysis
   */
  private getDefaultTrendAnalysis(
    metric: string,
    timeRange: string,
  ): TrendAnalysis {
    return {
      metric,
      timeRange,
      direction: 'stable',
      changePercentage: 0,
      significance: 'low',
      dataPoints: [],
      prediction: {
        nextHour: 0,
        nextDay: 0,
        confidence: 0,
      },
      anomalies: [],
    };
  }

  /**
   * Generate comprehensive performance report
   */
  async generatePerformanceReport(
    timeRange: string = '24h',
  ): Promise<PerformanceReport> {
    const metrics = Array.from(this.dataPoints.keys());
    const trends: TrendAnalysis[] = [];

    let improvingMetrics = 0;
    let degradingMetrics = 0;

    for (const metric of metrics) {
      const analysis = await this.analyzeTrend(metric, timeRange);
      trends.push(analysis);

      if (analysis.direction === 'up' && this.isImprovingMetric(metric)) {
        improvingMetrics++;
      } else if (
        analysis.direction === 'down' &&
        this.isDegradingMetric(metric)
      ) {
        degradingMetrics++;
      }
    }

    const activeAlerts = Array.from(this.alerts.values()).filter(
      (a) => !a.resolved,
    );
    const criticalAlerts = activeAlerts.filter(
      (a) => a.severity === 'critical',
    ).length;

    const overallHealth = this.calculateOverallHealth(trends, activeAlerts);
    const recommendations = this.generateRecommendations(trends, activeAlerts);
    const keyInsights = this.generateKeyInsights(trends);

    return {
      generatedAt: new Date(),
      timeRange,
      summary: {
        overallHealth,
        criticalAlerts,
        improvingMetrics,
        degradingMetrics,
      },
      trends,
      alerts: activeAlerts,
      recommendations,
      keyInsights,
    };
  }

  /**
   * Calculate overall health score
   */
  private calculateOverallHealth(
    trends: TrendAnalysis[],
    alerts: PerformanceAlert[],
  ): number {
    let score = 100;

    // Penalize critical alerts
    score -= alerts.filter((a) => a.severity === 'critical').length * 20;
    score -= alerts.filter((a) => a.severity === 'error').length * 10;
    score -= alerts.filter((a) => a.severity === 'warning').length * 5;

    // Penalize negative trends
    const criticalTrends = trends.filter(
      (t) => t.significance === 'critical',
    ).length;
    const highTrends = trends.filter((t) => t.significance === 'high').length;

    score -= criticalTrends * 15;
    score -= highTrends * 5;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Generate recommendations based on analysis
   */
  private generateRecommendations(
    trends: TrendAnalysis[],
    alerts: PerformanceAlert[],
  ): string[] {
    const recommendations: string[] = [];

    // CPU recommendations
    const cpuTrend = trends.find((t) => t.metric === 'cpu_usage');
    if (
      cpuTrend &&
      cpuTrend.direction === 'up' &&
      cpuTrend.significance === 'high'
    ) {
      recommendations.push(
        'High CPU usage trend detected. Consider optimizing application code or scaling horizontally.',
      );
    }

    // Memory recommendations
    const memoryTrend = trends.find((t) => t.metric === 'memory_usage');
    if (
      memoryTrend &&
      memoryTrend.direction === 'up' &&
      memoryTrend.significance === 'high'
    ) {
      recommendations.push(
        'Memory usage is increasing. Check for memory leaks and optimize memory usage.',
      );
    }

    // Response time recommendations
    const responseTrend = trends.find((t) => t.metric === 'response_time');
    if (responseTrend && responseTrend.direction === 'up') {
      recommendations.push(
        'Response times are increasing. Optimize database queries and implement caching.',
      );
    }

    // Error rate recommendations
    const errorTrend = trends.find((t) => t.metric === 'error_rate');
    if (errorTrend && errorTrend.direction === 'up') {
      recommendations.push(
        'Error rate is increasing. Review application logs and fix critical issues.',
      );
    }

    // Cache recommendations
    const cacheTrend = trends.find((t) => t.metric === 'cache_hit_rate');
    if (cacheTrend && cacheTrend.direction === 'down') {
      recommendations.push(
        'Cache hit rate is decreasing. Review cache strategy and implement cache warming.',
      );
    }

    return recommendations;
  }

  /**
   * Generate key insights
   */
  private generateKeyInsights(trends: TrendAnalysis[]): string[] {
    const insights: string[] = [];

    const stableTrends = trends.filter((t) => t.direction === 'stable').length;
    const totalTrends = trends.length;

    if (stableTrends / totalTrends > 0.8) {
      insights.push('System performance is stable across most metrics.');
    }

    const criticalTrends = trends.filter((t) => t.significance === 'critical');
    if (criticalTrends.length > 0) {
      insights.push(
        `${criticalTrends.length} metrics showing critical changes requiring immediate attention.`,
      );
    }

    const improvingTrends = trends.filter(
      (t) =>
        t.direction === 'down' &&
        ['cpu_usage', 'memory_usage', 'response_time', 'error_rate'].includes(
          t.metric,
        ),
    );
    if (improvingTrends.length > 0) {
      insights.push(
        `Performance improvements detected in ${improvingTrends.map((t) => t.metric).join(', ')}.`,
      );
    }

    return insights;
  }

  /**
   * Check if metric improvement is positive
   */
  private isImprovingMetric(metric: string): boolean {
    return ['cache_hit_rate'].includes(metric);
  }

  /**
   * Check if metric degradation is negative
   */
  private isDegradingMetric(metric: string): boolean {
    return [
      'cpu_usage',
      'memory_usage',
      'response_time',
      'error_rate',
      'disk_usage',
    ].includes(metric);
  }

  /**
   * Resolve alert
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.resolved = true;
      this.eventEmitter.emit('performance.alert_resolved', alert);
      return true;
    }
    return false;
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): PerformanceAlert[] {
    return Array.from(this.alerts.values()).filter((a) => !a.resolved);
  }

  /**
   * Get performance trends for dashboard
   */
  async getPerformanceTrends(
    timeRange: string = '1h',
  ): Promise<TrendAnalysis[]> {
    const metrics = Array.from(this.dataPoints.keys());
    const trends: TrendAnalysis[] = [];

    for (const metric of metrics) {
      const analysis = await this.analyzeTrend(metric, timeRange);
      trends.push(analysis);
    }

    return trends.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return severityOrder[b.significance] - severityOrder[a.significance];
    });
  }

  /**
   * Set custom threshold for metric
   */
  setThreshold(metric: string, warning: number, critical: number): void {
    this.thresholds.set(metric, { warning, critical });
    this.logger.log(
      `⚙️ Updated thresholds for ${metric}: warning=${warning}, critical=${critical}`,
    );
  }

  /**
   * Get current metrics summary
   */
  getMetricsSummary(): Record<
    string,
    {
      current: number;
      trend: 'up' | 'down' | 'stable';
      change: number;
      status: 'normal' | 'warning' | 'critical';
    }
  > {
    const summary: Record<string, any> = {};

    for (const [metric, dataPoints] of this.dataPoints.entries()) {
      if (dataPoints.length === 0) continue;

      const latest = dataPoints[dataPoints.length - 1];
      const previous =
        dataPoints.length > 1 ? dataPoints[dataPoints.length - 2] : latest;

      const change = ((latest.value - previous.value) / previous.value) * 100;
      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (Math.abs(change) > 5) {
        trend = change > 0 ? 'up' : 'down';
      }

      const threshold = this.thresholds.get(metric);
      let status: 'normal' | 'warning' | 'critical' = 'normal';
      if (threshold) {
        if (latest.value >= threshold.critical) status = 'critical';
        else if (latest.value >= threshold.warning) status = 'warning';
      }

      summary[metric] = {
        current: latest.value,
        trend,
        change,
        status,
      };
    }

    return summary;
  }
}
