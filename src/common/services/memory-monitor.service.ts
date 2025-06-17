import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../redis/redis.service';

interface MemoryStats {
  rss: number; // Resident Set Size
  heapTotal: number; // Total heap memory
  heapUsed: number; // Used heap memory
  external: number; // External memory
  arrayBuffers: number; // ArrayBuffer memory
  timestamp: number;
}

@Injectable()
export class MemoryMonitorService implements OnModuleInit {
  private readonly logger = new Logger('MemoryMonitor');
  private monitoringInterval: NodeJS.Timeout | null = null;
  private readonly MEMORY_THRESHOLD_MB = 500; // Warning threshold
  private readonly CRITICAL_THRESHOLD_MB = 800; // Critical threshold
  private readonly MONITOR_INTERVAL_MS = 30000; // 30 seconds

  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {}

  onModuleInit() {
    if (this.configService.get('NODE_ENV') === 'production') {
      this.startMonitoring();
    }
  }

  startMonitoring(): void {
    this.logger.log('Starting memory monitoring...');

    this.monitoringInterval = setInterval(() => {
      this.checkMemoryUsage();
    }, this.MONITOR_INTERVAL_MS);

    // Initial check
    this.checkMemoryUsage();
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      this.logger.log('Memory monitoring stopped');
    }
  }

  private async checkMemoryUsage(): Promise<void> {
    const memoryUsage = process.memoryUsage();
    const stats: MemoryStats = {
      rss: memoryUsage.rss,
      heapTotal: memoryUsage.heapTotal,
      heapUsed: memoryUsage.heapUsed,
      external: memoryUsage.external,
      arrayBuffers: memoryUsage.arrayBuffers,
      timestamp: Date.now(),
    };

    // Convert to MB for easier reading
    const rsseMB = Math.round(stats.rss / 1024 / 1024);
    const heapUsedMB = Math.round(stats.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(stats.heapTotal / 1024 / 1024);

    // Log memory usage
    this.logger.debug(
      `Memory Usage - RSS: ${rsseMB}MB, Heap: ${heapUsedMB}/${heapTotalMB}MB`,
    );

    // Check thresholds
    if (rsseMB > this.CRITICAL_THRESHOLD_MB) {
      this.logger.error(
        `CRITICAL: Memory usage is very high: ${rsseMB}MB (threshold: ${this.CRITICAL_THRESHOLD_MB}MB)`,
      );
      await this.triggerMemoryCleanup();
    } else if (rsseMB > this.MEMORY_THRESHOLD_MB) {
      this.logger.warn(
        `WARNING: Memory usage is high: ${rsseMB}MB (threshold: ${this.MEMORY_THRESHOLD_MB}MB)`,
      );
    }

    // Store metrics in Redis for monitoring dashboard
    await this.storeMemoryMetrics(stats);
  }

  private async triggerMemoryCleanup(): Promise<void> {
    this.logger.log('Triggering memory cleanup...');

    try {
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
        this.logger.log('Garbage collection triggered');
      }

      // Clear some Redis cache if memory is critical
      const keys = await this.redisService.keys('gql:cache:*');
      if (keys.length > 100) {
        // Remove oldest 25% of GraphQL cache entries
        const keysToDelete = keys.slice(0, Math.floor(keys.length * 0.25));
        for (const key of keysToDelete) {
          await this.redisService.del(key);
        }
        this.logger.log(
          `Cleared ${keysToDelete.length} cache entries to free memory`,
        );
      }
    } catch (error) {
      this.logger.error('Error during memory cleanup:', error);
    }
  }

  private async storeMemoryMetrics(stats: MemoryStats): Promise<void> {
    try {
      const key = `memory:metrics:${Math.floor(stats.timestamp / 60000)}`; // Per minute
      await this.redisService.setJson(key, stats, 3600); // Keep for 1 hour
    } catch (error) {
      // Don't log this error as it's not critical
    }
  }

  async getMemoryStats(): Promise<MemoryStats> {
    const memoryUsage = process.memoryUsage();
    return {
      rss: memoryUsage.rss,
      heapTotal: memoryUsage.heapTotal,
      heapUsed: memoryUsage.heapUsed,
      external: memoryUsage.external,
      arrayBuffers: memoryUsage.arrayBuffers,
      timestamp: Date.now(),
    };
  }

  async getMemoryHistory(minutes: number = 60): Promise<MemoryStats[]> {
    const now = Date.now();
    const history: MemoryStats[] = [];

    for (let i = 0; i < minutes; i++) {
      const timestamp = now - i * 60000; // Go back minute by minute
      const key = `memory:metrics:${Math.floor(timestamp / 60000)}`;

      try {
        const stats = await this.redisService.getJson<MemoryStats>(key);
        if (stats) {
          history.push(stats);
        }
      } catch (error) {
        // Skip missing data points
      }
    }

    return history.reverse(); // Return chronological order
  }
}
