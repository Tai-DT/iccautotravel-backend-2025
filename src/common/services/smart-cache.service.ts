import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import Redis from 'ioredis';
import * as crypto from 'crypto';

interface CacheMetrics {
  hits: number;
  misses: number;
  hitRate: number;
  totalRequests: number;
  averageResponseTime: number;
  memoryUsage: number;
  keyCount: number;
  evictions: number;
}

interface CacheEntry {
  key: string;
  data: any;
  ttl: number;
  timestamp: Date;
  accessCount: number;
  lastAccessed: Date;
  size: number;
  tags: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface CacheWarmupRule {
  id: string;
  name: string;
  pattern: string;
  priority: number;
  frequency: number; // minutes
  dataSource: () => Promise<any>;
  keyGenerator: (data: any) => string[];
  ttl: number;
  tags: string[];
  enabled: boolean;
}

interface CacheInvalidationRule {
  id: string;
  trigger: string; // event name
  patterns: string[]; // key patterns to invalidate
  tags: string[]; // tags to invalidate
  cascade: boolean; // whether to invalidate related keys
}

@Injectable()
export class SmartCacheService implements OnModuleInit {
  private readonly logger = new Logger(SmartCacheService.name);
  private redis: Redis;
  private metrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    hitRate: 0,
    totalRequests: 0,
    averageResponseTime: 0,
    memoryUsage: 0,
    keyCount: 0,
    evictions: 0,
  };

  private warmupRules = new Map<string, CacheWarmupRule>();
  private invalidationRules = new Map<string, CacheInvalidationRule>();
  private warmupIntervals = new Map<string, NodeJS.Timeout>();
  private responseTimeSum = 0;
  private responseTimeCount = 0;

  constructor(
    private configService: ConfigService,
    private eventEmitter: EventEmitter2,
  ) {
    this.setupRedisConnection();
  }

  async onModuleInit() {
    this.logger.log('🔄 Initializing Smart Cache Service...');
    await this.setupDefaultWarmupRules();
    await this.setupDefaultInvalidationRules();
    this.startMetricsCollection();
    this.setupEventListeners();
    await this.initialCacheWarmup();
    this.logger.log('✅ Smart Cache Service initialized successfully');
  }

  /**
   * Setup Redis connection with optimized settings
   */
  private setupRedisConnection(): void {
    const disableRedis = this.configService.get<boolean>('DISABLE_REDIS');

    if (disableRedis) {
      this.logger.warn(
        '🚫 Redis is disabled via DISABLE_REDIS flag - using mock cache',
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
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      keepAlive: 30000,
      family: 4,
      keyPrefix: 'iccautotravel:cache:',
      // Optimize for performance
      enableReadyCheck: false,
      maxLoadingRetryTime: 3000,
    });

    this.redis.on('connect', () => {
      this.logger.log('🔗 Connected to Redis cache server');
    });

    this.redis.on('error', (error) => {
      this.logger.error('❌ Redis connection error:', error);
    });
  }

  /**
   * Get value from cache with intelligent analytics
   */
  async get<T>(
    key: string,
    options?: {
      defaultValue?: T;
      ttl?: number;
      tags?: string[];
      priority?: 'low' | 'medium' | 'high' | 'critical';
    },
  ): Promise<T | null> {
    const startTime = Date.now();

    try {
      this.metrics.totalRequests++;

      const cached = await this.redis.get(key);
      const responseTime = Date.now() - startTime;
      this.updateResponseTime(responseTime);

      if (cached) {
        this.metrics.hits++;
        this.updateHitRate();

        // Update access metadata
        await this.updateAccessMetadata(key);

        // Emit cache hit event
        this.eventEmitter.emit('cache.hit', { key, responseTime });

        return JSON.parse(cached);
      } else {
        this.metrics.misses++;
        this.updateHitRate();

        // Emit cache miss event
        this.eventEmitter.emit('cache.miss', { key, responseTime });

        return options?.defaultValue || null;
      }
    } catch (error) {
      this.logger.error(`❌ Cache get error for key ${key}:`, error);
      return options?.defaultValue || null;
    }
  }

  /**
   * Set value in cache with smart metadata
   */
  async set<T>(
    key: string,
    value: T,
    options?: {
      ttl?: number;
      tags?: string[];
      priority?: 'low' | 'medium' | 'high' | 'critical';
    },
  ): Promise<boolean> {
    try {
      const ttl = options?.ttl || 3600; // 1 hour default
      const tags = options?.tags || [];
      const priority = options?.priority || 'medium';

      const serialized = JSON.stringify(value);
      const size = Buffer.byteLength(serialized, 'utf8');

      // Set main cache entry
      await this.redis.setex(key, ttl, serialized);

      // Set metadata
      const metadata: Partial<CacheEntry> = {
        timestamp: new Date(),
        accessCount: 1,
        lastAccessed: new Date(),
        size,
        tags,
        priority,
        ttl,
      };

      await this.redis.setex(
        `meta:${key}`,
        ttl + 60, // Keep metadata slightly longer
        JSON.stringify(metadata),
      );

      // Update tag index
      for (const tag of tags) {
        await this.redis.sadd(`tag:${tag}`, key);
        await this.redis.expire(`tag:${tag}`, ttl + 60);
      }

      // Update metrics
      await this.updateCacheMetrics();

      this.eventEmitter.emit('cache.set', { key, size, ttl, tags, priority });

      return true;
    } catch (error) {
      this.logger.error(`❌ Cache set error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get or set with automatic caching
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    options?: {
      ttl?: number;
      tags?: string[];
      priority?: 'low' | 'medium' | 'high' | 'critical';
    },
  ): Promise<T> {
    let cached = await this.get<T>(key, options);

    if (cached === null) {
      // Cache miss - generate value
      const startTime = Date.now();
      cached = await factory();
      const generationTime = Date.now() - startTime;

      // Cache the generated value
      await this.set(key, cached, options);

      this.eventEmitter.emit('cache.generated', {
        key,
        generationTime,
        size: JSON.stringify(cached).length,
      });
    }

    return cached;
  }

  /**
   * Delete cache entry
   */
  async delete(key: string): Promise<boolean> {
    try {
      const result = await this.redis.del(key);
      await this.redis.del(`meta:${key}`);

      this.eventEmitter.emit('cache.deleted', { key });
      return result > 0;
    } catch (error) {
      this.logger.error(`❌ Cache delete error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Invalidate cache by pattern
   */
  async invalidateByPattern(pattern: string): Promise<number> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length === 0) return 0;

      const result = await this.redis.del(...keys);

      // Also delete metadata
      const metaKeys = keys.map((key) => `meta:${key}`);
      await this.redis.del(...metaKeys);

      this.eventEmitter.emit('cache.pattern_invalidated', {
        pattern,
        count: result,
      });
      this.logger.log(
        `🗑️ Invalidated ${result} cache entries matching pattern: ${pattern}`,
      );

      return result;
    } catch (error) {
      this.logger.error(`❌ Pattern invalidation error for ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * Invalidate cache by tags
   */
  async invalidateByTags(tags: string[]): Promise<number> {
    try {
      let totalInvalidated = 0;

      for (const tag of tags) {
        const keys = await this.redis.smembers(`tag:${tag}`);
        if (keys.length > 0) {
          const result = await this.redis.del(...keys);
          totalInvalidated += result;

          // Delete metadata
          const metaKeys = keys.map((key) => `meta:${key}`);
          await this.redis.del(...metaKeys);
        }

        // Clean up tag index
        await this.redis.del(`tag:${tag}`);
      }

      this.eventEmitter.emit('cache.tags_invalidated', {
        tags,
        count: totalInvalidated,
      });
      this.logger.log(
        `🗑️ Invalidated ${totalInvalidated} cache entries for tags: ${tags.join(', ')}`,
      );

      return totalInvalidated;
    } catch (error) {
      this.logger.error(`❌ Tag invalidation error for tags ${tags}:`, error);
      return 0;
    }
  }

  /**
   * Setup default cache warmup rules
   */
  private async setupDefaultWarmupRules(): Promise<void> {
    // Popular services warmup
    this.addWarmupRule({
      id: 'popular-services',
      name: 'Popular Services',
      pattern: 'services:popular:*',
      priority: 1,
      frequency: 30, // 30 minutes
      dataSource: async () => {
        // In real implementation, fetch from database
        return [
          { id: 1, name: 'Airport Transfer', category: 'transfer' },
          { id: 2, name: 'City Tour', category: 'tour' },
          { id: 3, name: 'Hotel Booking', category: 'hotel' },
        ];
      },
      keyGenerator: (services) => services.map((s) => `service:${s.id}`),
      ttl: 3600,
      tags: ['services', 'popular'],
      enabled: true,
    });

    // Locations warmup
    this.addWarmupRule({
      id: 'popular-locations',
      name: 'Popular Locations',
      pattern: 'locations:popular:*',
      priority: 2,
      frequency: 60, // 1 hour
      dataSource: async () => {
        return [
          { id: 1, name: 'Ho Chi Minh City', country: 'Vietnam' },
          { id: 2, name: 'Hanoi', country: 'Vietnam' },
          { id: 3, name: 'Da Nang', country: 'Vietnam' },
        ];
      },
      keyGenerator: (locations) => locations.map((l) => `location:${l.id}`),
      ttl: 7200,
      tags: ['locations', 'popular'],
      enabled: true,
    });

    // Dashboard data warmup
    this.addWarmupRule({
      id: 'dashboard-stats',
      name: 'Dashboard Statistics',
      pattern: 'dashboard:stats:*',
      priority: 3,
      frequency: 15, // 15 minutes
      dataSource: async () => {
        return {
          totalBookings: 1250,
          totalRevenue: 125000,
          activeUsers: 89,
          popularServices: ['Airport Transfer', 'City Tour'],
        };
      },
      keyGenerator: (stats) => ['dashboard:stats:overview'],
      ttl: 900, // 15 minutes
      tags: ['dashboard', 'stats'],
      enabled: true,
    });

    this.logger.log(`📋 Setup ${this.warmupRules.size} cache warmup rules`);
  }

  /**
   * Setup default invalidation rules
   */
  private async setupDefaultInvalidationRules(): Promise<void> {
    // Service updates invalidate service caches
    this.addInvalidationRule({
      id: 'service-updated',
      trigger: 'service.updated',
      patterns: ['service:*', 'services:*'],
      tags: ['services'],
      cascade: true,
    });

    // Booking created invalidates related caches
    this.addInvalidationRule({
      id: 'booking-created',
      trigger: 'booking.created',
      patterns: ['dashboard:stats:*'],
      tags: ['dashboard', 'stats'],
      cascade: false,
    });

    // User updated invalidates user caches
    this.addInvalidationRule({
      id: 'user-updated',
      trigger: 'user.updated',
      patterns: ['user:*'],
      tags: ['users'],
      cascade: false,
    });

    this.logger.log(
      `🔄 Setup ${this.invalidationRules.size} cache invalidation rules`,
    );
  }

  /**
   * Add warmup rule
   */
  addWarmupRule(rule: CacheWarmupRule): void {
    this.warmupRules.set(rule.id, rule);

    if (rule.enabled) {
      this.scheduleWarmup(rule);
    }
  }

  /**
   * Add invalidation rule
   */
  addInvalidationRule(rule: CacheInvalidationRule): void {
    this.invalidationRules.set(rule.id, rule);
  }

  /**
   * Schedule cache warmup
   */
  private scheduleWarmup(rule: CacheWarmupRule): void {
    // Clear existing interval
    const existingInterval = this.warmupIntervals.get(rule.id);
    if (existingInterval) {
      clearInterval(existingInterval);
    }

    // Schedule new interval
    const interval = setInterval(
      async () => {
        await this.executeWarmup(rule);
      },
      rule.frequency * 60 * 1000,
    );

    this.warmupIntervals.set(rule.id, interval);
    this.logger.log(
      `⏰ Scheduled warmup for '${rule.name}' every ${rule.frequency} minutes`,
    );
  }

  /**
   * Execute cache warmup
   */
  private async executeWarmup(rule: CacheWarmupRule): Promise<void> {
    try {
      this.logger.log(`🔥 Executing warmup: ${rule.name}`);

      const startTime = Date.now();
      const data = await rule.dataSource();
      const keys = rule.keyGenerator(data);

      let warmedCount = 0;
      for (const key of keys) {
        const success = await this.set(key, data, {
          ttl: rule.ttl,
          tags: rule.tags,
          priority: 'high',
        });

        if (success) warmedCount++;
      }

      const duration = Date.now() - startTime;
      this.logger.log(
        `✅ Warmup '${rule.name}' completed: ${warmedCount}/${keys.length} keys in ${duration}ms`,
      );

      this.eventEmitter.emit('cache.warmup_completed', {
        ruleId: rule.id,
        ruleName: rule.name,
        keysWarmed: warmedCount,
        totalKeys: keys.length,
        duration,
      });
    } catch (error) {
      this.logger.error(`❌ Warmup failed for '${rule.name}':`, error);
      this.eventEmitter.emit('cache.warmup_failed', {
        ruleId: rule.id,
        ruleName: rule.name,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Perform initial cache warmup
   */
  private async initialCacheWarmup(): Promise<void> {
    this.logger.log('🔥 Starting initial cache warmup...');

    const sortedRules = Array.from(this.warmupRules.values())
      .filter((rule) => rule.enabled)
      .sort((a, b) => a.priority - b.priority);

    for (const rule of sortedRules) {
      await this.executeWarmup(rule);
    }

    this.logger.log('✅ Initial cache warmup completed');
  }

  /**
   * Setup event listeners for automatic invalidation
   */
  private setupEventListeners(): void {
    for (const rule of this.invalidationRules.values()) {
      this.eventEmitter.on(rule.trigger, async (eventData) => {
        await this.executeInvalidation(rule, eventData);
      });
    }

    this.logger.log(
      `👂 Setup ${this.invalidationRules.size} event listeners for cache invalidation`,
    );
  }

  /**
   * Execute cache invalidation
   */
  private async executeInvalidation(
    rule: CacheInvalidationRule,
    eventData: any,
  ): Promise<void> {
    try {
      this.logger.log(`🗑️ Executing invalidation for event: ${rule.trigger}`);

      let totalInvalidated = 0;

      // Invalidate by patterns
      for (const pattern of rule.patterns) {
        const count = await this.invalidateByPattern(pattern);
        totalInvalidated += count;
      }

      // Invalidate by tags
      if (rule.tags.length > 0) {
        const count = await this.invalidateByTags(rule.tags);
        totalInvalidated += count;
      }

      this.logger.log(
        `✅ Invalidation completed: ${totalInvalidated} entries invalidated`,
      );

      this.eventEmitter.emit('cache.invalidation_completed', {
        ruleId: rule.id,
        trigger: rule.trigger,
        entriesInvalidated: totalInvalidated,
        eventData,
      });
    } catch (error) {
      this.logger.error(
        `❌ Invalidation failed for trigger '${rule.trigger}':`,
        error,
      );
    }
  }

  /**
   * Update access metadata
   */
  private async updateAccessMetadata(key: string): Promise<void> {
    try {
      const metaKey = `meta:${key}`;
      const metaData = await this.redis.get(metaKey);

      if (metaData) {
        const meta = JSON.parse(metaData);
        meta.accessCount = (meta.accessCount || 0) + 1;
        meta.lastAccessed = new Date();

        await this.redis.setex(metaKey, meta.ttl + 60, JSON.stringify(meta));
      }
    } catch (error) {
      // Silent fail for metadata updates
    }
  }

  /**
   * Update response time metrics
   */
  private updateResponseTime(responseTime: number): void {
    this.responseTimeSum += responseTime;
    this.responseTimeCount++;
    this.metrics.averageResponseTime =
      this.responseTimeSum / this.responseTimeCount;
  }

  /**
   * Update hit rate
   */
  private updateHitRate(): void {
    this.metrics.hitRate =
      (this.metrics.hits / this.metrics.totalRequests) * 100;
  }

  /**
   * Update cache metrics
   */
  private async updateCacheMetrics(): Promise<void> {
    try {
      const info = await this.redis.info('memory');
      const memoryMatch = info.match(/used_memory:(\d+)/);
      this.metrics.memoryUsage = memoryMatch ? parseInt(memoryMatch[1]) : 0;

      const keyspaceInfo = await this.redis.info('keyspace');
      const keyCountMatch = keyspaceInfo.match(/keys=(\d+)/);
      this.metrics.keyCount = keyCountMatch ? parseInt(keyCountMatch[1]) : 0;
    } catch (error) {
      // Silent fail for metrics updates
    }
  }

  /**
   * Start metrics collection
   */
  private startMetricsCollection(): void {
    setInterval(async () => {
      await this.updateCacheMetrics();
      this.eventEmitter.emit('cache.metrics_updated', this.metrics);
    }, 60000); // Every minute
  }

  /**
   * Get cache metrics
   */
  getMetrics(): CacheMetrics {
    return { ...this.metrics };
  }

  /**
   * Get cache analytics
   */
  async getCacheAnalytics(): Promise<{
    metrics: CacheMetrics;
    topKeys: Array<{ key: string; accessCount: number; size: number }>;
    warmupRules: CacheWarmupRule[];
    invalidationRules: CacheInvalidationRule[];
  }> {
    // Get top accessed keys
    const topKeys = await this.getTopAccessedKeys();

    return {
      metrics: this.getMetrics(),
      topKeys,
      warmupRules: Array.from(this.warmupRules.values()),
      invalidationRules: Array.from(this.invalidationRules.values()),
    };
  }

  /**
   * Get top accessed keys
   */
  private async getTopAccessedKeys(): Promise<
    Array<{ key: string; accessCount: number; size: number }>
  > {
    try {
      const metaKeys = await this.redis.keys('meta:*');
      const topKeys: Array<{ key: string; accessCount: number; size: number }> =
        [];

      for (const metaKey of metaKeys.slice(0, 10)) {
        // Limit to top 10
        const metaData = await this.redis.get(metaKey);
        if (metaData) {
          const meta = JSON.parse(metaData);
          const key = metaKey.replace('meta:', '');
          topKeys.push({
            key,
            accessCount: meta.accessCount || 0,
            size: meta.size || 0,
          });
        }
      }

      return topKeys.sort((a, b) => b.accessCount - a.accessCount);
    } catch (error) {
      this.logger.error('❌ Error getting top accessed keys:', error);
      return [];
    }
  }

  /**
   * Clear all cache
   */
  async clearAll(): Promise<boolean> {
    try {
      await this.redis.flushdb();
      this.logger.log('🗑️ All cache cleared');
      this.eventEmitter.emit('cache.cleared_all');
      return true;
    } catch (error) {
      this.logger.error('❌ Error clearing cache:', error);
      return false;
    }
  }

  /**
   * Enable/disable warmup rule
   */
  toggleWarmupRule(ruleId: string, enabled: boolean): boolean {
    const rule = this.warmupRules.get(ruleId);
    if (!rule) return false;

    rule.enabled = enabled;

    if (enabled) {
      this.scheduleWarmup(rule);
    } else {
      const interval = this.warmupIntervals.get(ruleId);
      if (interval) {
        clearInterval(interval);
        this.warmupIntervals.delete(ruleId);
      }
    }

    this.logger.log(
      `${enabled ? '✅' : '⏹️'} Warmup rule '${rule.name}' ${enabled ? 'enabled' : 'disabled'}`,
    );
    return true;
  }

  /**
   * Generate cache key with hash
   */
  generateKey(prefix: string, data: any): string {
    const hash = crypto
      .createHash('md5')
      .update(JSON.stringify(data))
      .digest('hex')
      .substr(0, 8);

    return `${prefix}:${hash}`;
  }

  /**
   * Get cache health score
   */
  getCacheHealthScore(): number {
    let score = 100;

    // Penalize low hit rate
    if (this.metrics.hitRate < 50) score -= 30;
    else if (this.metrics.hitRate < 70) score -= 15;

    // Penalize slow response times
    if (this.metrics.averageResponseTime > 100) score -= 20;
    else if (this.metrics.averageResponseTime > 50) score -= 10;

    // Penalize high memory usage (if available)
    if (this.metrics.memoryUsage > 500 * 1024 * 1024) score -= 15; // 500MB

    return Math.max(0, score);
  }
}
