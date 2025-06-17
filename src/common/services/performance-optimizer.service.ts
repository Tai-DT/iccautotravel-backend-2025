import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as os from 'os';
import * as cluster from 'cluster';
import { performance } from 'perf_hooks';

interface PerformanceMetrics {
  cpu: {
    usage: number;
    loadAverage: number[];
    coreCount: number;
  };
  memory: {
    used: number;
    free: number;
    total: number;
    percentage: number;
    heapUsed: number;
    heapTotal: number;
  };
  network: {
    bytesReceived: number;
    bytesSent: number;
    connectionsActive: number;
  };
  response: {
    averageTime: number;
    p95Time: number;
    p99Time: number;
    throughput: number;
  };
  database: {
    connectionPoolUsage: number;
    queryTime: number;
    slowQueries: number;
  };
}

interface OptimizationRule {
  id: string;
  name: string;
  condition: (metrics: PerformanceMetrics) => boolean;
  action: (metrics: PerformanceMetrics) => Promise<void>;
  priority: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
}

interface PerformanceOptimization {
  type: 'cpu' | 'memory' | 'network' | 'database' | 'cache';
  action: string;
  impact: 'low' | 'medium' | 'high';
  expectedImprovement: number;
  appliedAt: Date;
  result?: {
    beforeMetrics: Partial<PerformanceMetrics>;
    afterMetrics: Partial<PerformanceMetrics>;
    actualImprovement: number;
  };
}

@Injectable()
export class PerformanceOptimizerService implements OnModuleInit {
  private readonly logger = new Logger(PerformanceOptimizerService.name);
  private currentMetrics: PerformanceMetrics | null = null;
  private optimizationRules: OptimizationRule[] = [];
  private appliedOptimizations: PerformanceOptimization[] = [];
  private metricsHistory: PerformanceMetrics[] = [];
  private optimizationInterval: NodeJS.Timeout | null = null;

  constructor(
    private configService: ConfigService,
    private eventEmitter: EventEmitter2,
  ) {
    this.initializeOptimizationRules();
  }

  async onModuleInit() {
    this.logger.log('⚡ Initializing Performance Optimizer Service...');
    this.startContinuousOptimization();
    this.logger.log('✅ Performance Optimizer Service initialized');
  }

  /**
   * Initialize optimization rules
   */
  private initializeOptimizationRules(): void {
    this.optimizationRules = [
      // CPU Optimization Rules
      {
        id: 'high_cpu_usage',
        name: 'High CPU Usage Optimization',
        condition: (metrics) => metrics.cpu.usage > 80,
        action: async (metrics) => await this.optimizeCPUUsage(metrics),
        priority: 'high',
        enabled: true,
      },
      {
        id: 'cpu_load_balancing',
        name: 'CPU Load Balancing',
        condition: (metrics) =>
          metrics.cpu.loadAverage[0] > metrics.cpu.coreCount * 0.8,
        action: async (metrics) => await this.optimizeCPULoadBalancing(metrics),
        priority: 'medium',
        enabled: true,
      },

      // Memory Optimization Rules
      {
        id: 'high_memory_usage',
        name: 'High Memory Usage Optimization',
        condition: (metrics) => metrics.memory.percentage > 85,
        action: async (metrics) => await this.optimizeMemoryUsage(metrics),
        priority: 'critical',
        enabled: true,
      },
      {
        id: 'memory_leak_detection',
        name: 'Memory Leak Detection & Cleanup',
        condition: (metrics) => this.detectMemoryLeak(metrics),
        action: async (metrics) => await this.cleanupMemoryLeaks(metrics),
        priority: 'high',
        enabled: true,
      },

      // Network Optimization Rules
      {
        id: 'high_network_latency',
        name: 'Network Latency Optimization',
        condition: (metrics) => metrics.response.averageTime > 500,
        action: async (metrics) => await this.optimizeNetworkLatency(metrics),
        priority: 'high',
        enabled: true,
      },
      {
        id: 'connection_pooling',
        name: 'Connection Pool Optimization',
        condition: (metrics) => metrics.network.connectionsActive > 1000,
        action: async (metrics) =>
          await this.optimizeConnectionPooling(metrics),
        priority: 'medium',
        enabled: true,
      },

      // Database Optimization Rules
      {
        id: 'slow_database_queries',
        name: 'Slow Database Query Optimization',
        condition: (metrics) => metrics.database.queryTime > 100,
        action: async (metrics) => await this.optimizeDatabaseQueries(metrics),
        priority: 'high',
        enabled: true,
      },
      {
        id: 'database_connection_pool',
        name: 'Database Connection Pool Optimization',
        condition: (metrics) => metrics.database.connectionPoolUsage > 90,
        action: async (metrics) =>
          await this.optimizeDatabaseConnectionPool(metrics),
        priority: 'critical',
        enabled: true,
      },

      // Response Time Optimization Rules
      {
        id: 'p99_response_time',
        name: 'P99 Response Time Optimization',
        condition: (metrics) => metrics.response.p99Time > 2000,
        action: async (metrics) => await this.optimizeP99ResponseTime(metrics),
        priority: 'high',
        enabled: true,
      },
      {
        id: 'throughput_optimization',
        name: 'Throughput Optimization',
        condition: (metrics) => metrics.response.throughput < 1000,
        action: async (metrics) => await this.optimizeThroughput(metrics),
        priority: 'medium',
        enabled: true,
      },
    ];

    this.logger.log(
      `⚙️ Initialized ${this.optimizationRules.length} optimization rules`,
    );
  }

  /**
   * Start continuous optimization
   */
  private startContinuousOptimization(): void {
    // Run optimization every 2 minutes
    this.optimizationInterval = setInterval(async () => {
      await this.collectMetrics();
      await this.analyzeAndOptimize();
      this.cleanupHistory();
    }, 120000);

    // Initial optimization
    setTimeout(async () => {
      await this.collectMetrics();
      await this.analyzeAndOptimize();
    }, 5000);

    this.logger.log('🔄 Started continuous performance optimization');
  }

  /**
   * Collect current performance metrics
   */
  private async collectMetrics(): Promise<void> {
    try {
      const startTime = performance.now();

      // CPU Metrics
      const cpuUsage = await this.getCPUUsage();
      const loadAverage = os.loadavg();
      const coreCount = os.cpus().length;

      // Memory Metrics
      const memInfo = process.memoryUsage();
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMem = totalMem - freeMem;

      // Network Metrics (simulated - would integrate with actual monitoring)
      const networkMetrics = await this.getNetworkMetrics();

      // Response Time Metrics
      const responseMetrics = await this.getResponseTimeMetrics();

      // Database Metrics
      const databaseMetrics = await this.getDatabaseMetrics();

      this.currentMetrics = {
        cpu: {
          usage: cpuUsage,
          loadAverage,
          coreCount,
        },
        memory: {
          used: usedMem,
          free: freeMem,
          total: totalMem,
          percentage: (usedMem / totalMem) * 100,
          heapUsed: memInfo.heapUsed,
          heapTotal: memInfo.heapTotal,
        },
        network: networkMetrics,
        response: responseMetrics,
        database: databaseMetrics,
      };

      // Store in history
      this.metricsHistory.push({
        ...this.currentMetrics,
        timestamp: new Date(),
      } as any);

      // Emit metrics event
      this.eventEmitter.emit(
        'performance.metrics_collected',
        this.currentMetrics,
      );

      const collectionTime = performance.now() - startTime;
      this.logger.debug(
        `📊 Metrics collected in ${collectionTime.toFixed(2)}ms`,
      );
    } catch (error) {
      this.logger.error('❌ Error collecting performance metrics:', error);
    }
  }

  /**
   * Get CPU usage percentage
   */
  private async getCPUUsage(): Promise<number> {
    return new Promise((resolve) => {
      const startUsage = process.cpuUsage();
      const startTime = performance.now();

      setTimeout(() => {
        const currentUsage = process.cpuUsage(startUsage);
        const elapsedTime = (performance.now() - startTime) * 1000; // Convert to microseconds

        const totalUsage = currentUsage.user + currentUsage.system;
        const cpuPercent = (totalUsage / elapsedTime) * 100;

        resolve(Math.min(100, Math.max(0, cpuPercent)));
      }, 100);
    });
  }

  /**
   * Get network metrics
   */
  private async getNetworkMetrics(): Promise<PerformanceMetrics['network']> {
    // In real implementation, would collect from network monitoring
    return {
      bytesReceived: Math.random() * 1000000,
      bytesSent: Math.random() * 1000000,
      connectionsActive: Math.floor(Math.random() * 500),
    };
  }

  /**
   * Get response time metrics
   */
  private async getResponseTimeMetrics(): Promise<
    PerformanceMetrics['response']
  > {
    // In real implementation, would collect from request monitoring
    return {
      averageTime: 50 + Math.random() * 500,
      p95Time: 100 + Math.random() * 1000,
      p99Time: 200 + Math.random() * 2000,
      throughput: 800 + Math.random() * 400,
    };
  }

  /**
   * Get database metrics
   */
  private async getDatabaseMetrics(): Promise<PerformanceMetrics['database']> {
    // In real implementation, would collect from database monitoring
    return {
      connectionPoolUsage: Math.random() * 100,
      queryTime: 10 + Math.random() * 200,
      slowQueries: Math.floor(Math.random() * 10),
    };
  }

  /**
   * Analyze metrics and apply optimizations
   */
  private async analyzeAndOptimize(): Promise<void> {
    if (!this.currentMetrics) return;

    for (const rule of this.optimizationRules) {
      if (!rule.enabled) continue;

      try {
        if (rule.condition(this.currentMetrics)) {
          this.logger.log(`🔧 Applying optimization: ${rule.name}`);

          const beforeMetrics = { ...this.currentMetrics };
          await rule.action(this.currentMetrics);

          // Wait a bit and collect new metrics to measure improvement
          setTimeout(async () => {
            await this.collectMetrics();
            const afterMetrics = { ...this.currentMetrics };

            this.recordOptimization(rule, beforeMetrics, afterMetrics);
          }, 10000);
        }
      } catch (error) {
        this.logger.error(
          `❌ Error applying optimization ${rule.name}:`,
          error,
        );
      }
    }
  }

  /**
   * CPU Usage Optimization
   */
  private async optimizeCPUUsage(metrics: PerformanceMetrics): Promise<void> {
    this.logger.log('🔧 Optimizing CPU usage...');

    // Force garbage collection
    if (global.gc) {
      global.gc();
    }

    // Optimize event loop
    process.nextTick(() => {
      setImmediate(() => {
        // Defer non-critical tasks
      });
    });

    // Scale workers if needed (in cluster mode)
    if (
      ((cluster as any).isPrimary || (cluster as any).isMaster) &&
      metrics.cpu.usage > 90
    ) {
      this.eventEmitter.emit('performance.scale_workers', {
        action: 'add',
        reason: 'high_cpu_usage',
      });
    }

    this.recordOptimization({
      type: 'cpu',
      action: 'CPU usage optimization applied',
      impact: 'medium',
      expectedImprovement: 15,
      appliedAt: new Date(),
    });
  }

  /**
   * CPU Load Balancing Optimization
   */
  private async optimizeCPULoadBalancing(
    metrics: PerformanceMetrics,
  ): Promise<void> {
    this.logger.log('⚖️ Optimizing CPU load balancing...');

    // Distribute workload across cores
    if ((cluster as any).isPrimary || (cluster as any).isMaster) {
      this.eventEmitter.emit('performance.rebalance_load', {
        currentLoad: metrics.cpu.loadAverage,
        coreCount: metrics.cpu.coreCount,
      });
    }

    this.recordOptimization({
      type: 'cpu',
      action: 'CPU load balancing optimization',
      impact: 'medium',
      expectedImprovement: 20,
      appliedAt: new Date(),
    });
  }

  /**
   * Memory Usage Optimization
   */
  private async optimizeMemoryUsage(
    metrics: PerformanceMetrics,
  ): Promise<void> {
    this.logger.log('🧠 Optimizing memory usage...');

    // Force garbage collection
    if (global.gc) {
      global.gc();
      this.logger.log('♻️ Forced garbage collection');
    }

    // Clear internal caches
    this.eventEmitter.emit('performance.clear_caches', {
      reason: 'high_memory_usage',
      memoryUsage: metrics.memory.percentage,
    });

    // Optimize buffer sizes
    process.env.NODE_OPTIONS = '--max-old-space-size=4096';

    this.recordOptimization({
      type: 'memory',
      action: 'Memory usage optimization applied',
      impact: 'high',
      expectedImprovement: 25,
      appliedAt: new Date(),
    });
  }

  /**
   * Detect memory leaks
   */
  private detectMemoryLeak(metrics: PerformanceMetrics): boolean {
    if (this.metricsHistory.length < 5) return false;

    const recentMetrics = this.metricsHistory.slice(-5);
    const memoryTrend = recentMetrics.map((m) => m.memory.percentage);

    // Check if memory usage is consistently increasing
    let increasing = 0;
    for (let i = 1; i < memoryTrend.length; i++) {
      if (memoryTrend[i] > memoryTrend[i - 1]) {
        increasing++;
      }
    }

    return increasing >= 4 && metrics.memory.percentage > 80;
  }

  /**
   * Cleanup memory leaks
   */
  private async cleanupMemoryLeaks(metrics: PerformanceMetrics): Promise<void> {
    this.logger.warn('🔍 Memory leak detected, performing cleanup...');

    // Multiple garbage collection cycles
    if (global.gc) {
      for (let i = 0; i < 3; i++) {
        global.gc();
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    // Clear all possible caches
    this.eventEmitter.emit('performance.emergency_cache_clear');

    // Log memory leak detection
    this.eventEmitter.emit('performance.memory_leak_detected', {
      memoryUsage: metrics.memory.percentage,
      trend: this.metricsHistory.slice(-5).map((m) => m.memory.percentage),
    });

    this.recordOptimization({
      type: 'memory',
      action: 'Memory leak cleanup performed',
      impact: 'high',
      expectedImprovement: 30,
      appliedAt: new Date(),
    });
  }

  /**
   * Network Latency Optimization
   */
  private async optimizeNetworkLatency(
    metrics: PerformanceMetrics,
  ): Promise<void> {
    this.logger.log('🌐 Optimizing network latency...');

    // Enable keep-alive connections
    this.eventEmitter.emit('performance.optimize_network', {
      action: 'enable_keepalive',
      currentLatency: metrics.response.averageTime,
    });

    // Optimize connection pooling
    this.eventEmitter.emit('performance.optimize_connection_pool', {
      activeConnections: metrics.network.connectionsActive,
    });

    this.recordOptimization({
      type: 'network',
      action: 'Network latency optimization',
      impact: 'medium',
      expectedImprovement: 20,
      appliedAt: new Date(),
    });
  }

  /**
   * Connection Pooling Optimization
   */
  private async optimizeConnectionPooling(
    metrics: PerformanceMetrics,
  ): Promise<void> {
    this.logger.log('🔗 Optimizing connection pooling...');

    this.eventEmitter.emit('performance.scale_connection_pool', {
      currentConnections: metrics.network.connectionsActive,
      recommendation: 'increase_pool_size',
    });

    this.recordOptimization({
      type: 'network',
      action: 'Connection pooling optimization',
      impact: 'medium',
      expectedImprovement: 15,
      appliedAt: new Date(),
    });
  }

  /**
   * Database Query Optimization
   */
  private async optimizeDatabaseQueries(
    metrics: PerformanceMetrics,
  ): Promise<void> {
    this.logger.log('🗄️ Optimizing database queries...');

    this.eventEmitter.emit('performance.optimize_database_queries', {
      currentQueryTime: metrics.database.queryTime,
      slowQueries: metrics.database.slowQueries,
    });

    this.recordOptimization({
      type: 'database',
      action: 'Database query optimization',
      impact: 'high',
      expectedImprovement: 35,
      appliedAt: new Date(),
    });
  }

  /**
   * Database Connection Pool Optimization
   */
  private async optimizeDatabaseConnectionPool(
    metrics: PerformanceMetrics,
  ): Promise<void> {
    this.logger.log('📊 Optimizing database connection pool...');

    this.eventEmitter.emit('performance.scale_database_pool', {
      currentUsage: metrics.database.connectionPoolUsage,
      recommendation: 'emergency_scale',
    });

    this.recordOptimization({
      type: 'database',
      action: 'Database connection pool emergency scaling',
      impact: 'high',
      expectedImprovement: 40,
      appliedAt: new Date(),
    });
  }

  /**
   * P99 Response Time Optimization
   */
  private async optimizeP99ResponseTime(
    metrics: PerformanceMetrics,
  ): Promise<void> {
    this.logger.log('⚡ Optimizing P99 response time...');

    // Enable aggressive caching
    this.eventEmitter.emit('performance.enable_aggressive_caching', {
      currentP99: metrics.response.p99Time,
    });

    // Optimize critical path
    this.eventEmitter.emit('performance.optimize_critical_path');

    this.recordOptimization({
      type: 'cache',
      action: 'P99 response time optimization',
      impact: 'high',
      expectedImprovement: 45,
      appliedAt: new Date(),
    });
  }

  /**
   * Throughput Optimization
   */
  private async optimizeThroughput(metrics: PerformanceMetrics): Promise<void> {
    this.logger.log('🚀 Optimizing throughput...');

    this.eventEmitter.emit('performance.optimize_throughput', {
      currentThroughput: metrics.response.throughput,
      target: 2000,
    });

    this.recordOptimization({
      type: 'network',
      action: 'Throughput optimization',
      impact: 'high',
      expectedImprovement: 30,
      appliedAt: new Date(),
    });
  }

  /**
   * Record optimization application
   */
  private recordOptimization(
    rule: OptimizationRule | PerformanceOptimization,
    beforeMetrics?: PerformanceMetrics,
    afterMetrics?: PerformanceMetrics,
  ): void {
    const optimization: PerformanceOptimization =
      'id' in rule
        ? {
            type: 'cpu', // Default, would determine from rule
            action: rule.name,
            impact: rule.priority === 'critical' ? 'high' : rule.priority,
            expectedImprovement: 20, // Default
            appliedAt: new Date(),
          }
        : rule;

    if (beforeMetrics && afterMetrics) {
      optimization.result = {
        beforeMetrics,
        afterMetrics,
        actualImprovement: this.calculateImprovement(
          beforeMetrics,
          afterMetrics,
        ),
      };
    }

    this.appliedOptimizations.push(optimization);

    // Keep only last 100 optimizations
    if (this.appliedOptimizations.length > 100) {
      this.appliedOptimizations.shift();
    }

    this.eventEmitter.emit('performance.optimization_applied', optimization);
  }

  /**
   * Calculate improvement percentage
   */
  private calculateImprovement(
    before: PerformanceMetrics,
    after: PerformanceMetrics,
  ): number {
    // Simplified improvement calculation
    const beforeScore = this.calculatePerformanceScore(before);
    const afterScore = this.calculatePerformanceScore(after);

    return afterScore - beforeScore;
  }

  /**
   * Calculate performance score
   */
  private calculatePerformanceScore(metrics: PerformanceMetrics): number {
    let score = 100;

    // CPU penalty
    if (metrics.cpu.usage > 80) score -= 20;
    else if (metrics.cpu.usage > 60) score -= 10;

    // Memory penalty
    if (metrics.memory.percentage > 85) score -= 25;
    else if (metrics.memory.percentage > 70) score -= 15;

    // Response time penalty
    if (metrics.response.averageTime > 500) score -= 20;
    else if (metrics.response.averageTime > 200) score -= 10;

    // Database penalty
    if (metrics.database.queryTime > 100) score -= 15;
    else if (metrics.database.queryTime > 50) score -= 8;

    return Math.max(0, score);
  }

  /**
   * Cleanup old metrics history
   */
  private cleanupHistory(): void {
    // Keep only last 100 metrics
    if (this.metricsHistory.length > 100) {
      this.metricsHistory = this.metricsHistory.slice(-100);
    }
  }

  /**
   * Get current performance metrics
   */
  getCurrentMetrics(): PerformanceMetrics | null {
    return this.currentMetrics;
  }

  /**
   * Get optimization history
   */
  getOptimizationHistory(): PerformanceOptimization[] {
    return this.appliedOptimizations;
  }

  /**
   * Get performance report
   */
  getPerformanceReport(): {
    currentMetrics: PerformanceMetrics | null;
    score: number;
    optimizations: PerformanceOptimization[];
    recommendations: string[];
  } {
    const score = this.currentMetrics
      ? this.calculatePerformanceScore(this.currentMetrics)
      : 0;

    return {
      currentMetrics: this.currentMetrics,
      score,
      optimizations: this.appliedOptimizations,
      recommendations: this.generateRecommendations(),
    };
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    if (!this.currentMetrics) return recommendations;

    if (this.currentMetrics.cpu.usage > 80) {
      recommendations.push(
        'CPU usage is high. Consider scaling horizontally or optimizing CPU-intensive operations.',
      );
    }

    if (this.currentMetrics.memory.percentage > 85) {
      recommendations.push(
        'Memory usage is high. Review for memory leaks and consider increasing available memory.',
      );
    }

    if (this.currentMetrics.response.averageTime > 500) {
      recommendations.push(
        'Response times are slow. Implement caching and optimize database queries.',
      );
    }

    if (this.currentMetrics.database.queryTime > 100) {
      recommendations.push(
        'Database queries are slow. Add indexes and optimize query patterns.',
      );
    }

    return recommendations;
  }

  /**
   * Force optimization run
   */
  async forceOptimization(): Promise<void> {
    this.logger.log('🔧 Forcing performance optimization run...');
    await this.collectMetrics();
    await this.analyzeAndOptimize();
    this.logger.log('✅ Forced optimization completed');
  }

  /**
   * Enable/disable optimization rule
   */
  toggleOptimizationRule(ruleId: string, enabled: boolean): void {
    const rule = this.optimizationRules.find((r) => r.id === ruleId);
    if (rule) {
      rule.enabled = enabled;
      this.logger.log(
        `${enabled ? '✅' : '❌'} Optimization rule ${rule.name} ${enabled ? 'enabled' : 'disabled'}`,
      );
    }
  }

  /**
   * Shutdown service
   */
  async shutdown(): Promise<void> {
    if (this.optimizationInterval) {
      clearInterval(this.optimizationInterval);
    }

    this.logger.log('🛑 Performance Optimizer Service shutdown');
  }
}
