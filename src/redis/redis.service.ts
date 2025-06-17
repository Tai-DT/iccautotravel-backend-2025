import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private redisClient: Redis;

  constructor(private configService: ConfigService) {
    this.redisClient = this.createRedisClient();
  }

  async onModuleDestroy() {
    await this.redisClient.quit();
  }

  getClient(): Redis {
    return this.redisClient;
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    try {
      if (ttl) {
        await this.redisClient.setex(key, ttl, value);
      } else {
        await this.redisClient.set(key, value);
      }
    } catch (error) {
      this.logger.error(
        `Failed to set Redis key ${key}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      // Don't throw error, just log it for now
      // throw error;
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      return await this.redisClient.get(key);
    } catch (error) {
      this.logger.error(
        `Failed to get Redis key ${key}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      // Return null instead of throwing error
      return null;
    }
  }

  async del(key: string): Promise<number> {
    try {
      return await this.redisClient.del(key);
    } catch (error) {
      this.logger.error(
        `Failed to delete Redis key ${key}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw error;
    }
  }

  async exists(key: string): Promise<number> {
    try {
      return await this.redisClient.exists(key);
    } catch (error) {
      this.logger.error(
        `Failed to check Redis key ${key}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw error;
    }
  }

  async setJson(key: string, value: any, ttl?: number): Promise<void> {
    await this.set(key, JSON.stringify(value), ttl);
  }

  async getJson<T>(key: string): Promise<T | null> {
    const value = await this.get(key);
    return value ? JSON.parse(value) : null;
  }

  async ping(): Promise<string> {
    try {
      return await this.redisClient.ping();
    } catch (error) {
      this.logger.error(
        `Redis ping failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw error;
    }
  }

  async flush(): Promise<string> {
    try {
      return await this.redisClient.flushall();
    } catch (error) {
      this.logger.error(
        `Redis flush failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw error;
    }
  }

  async flushAll(): Promise<string> {
    try {
      return await this.redisClient.flushall();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Error flushing Redis: ${errorMessage}`, errorStack);
      throw error;
    }
  }

  async keys(pattern: string): Promise<string[]> {
    try {
      return await this.redisClient.keys(pattern);
    } catch (error) {
      this.logger.error(
        `Failed to get Redis keys for pattern ${pattern}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw error;
    }
  }

  async incr(key: string): Promise<number> {
    try {
      return await this.redisClient.incr(key);
    } catch (error) {
      this.logger.error(
        `Failed to increment Redis key ${key}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw error;
    }
  }

  async expire(key: string, seconds: number): Promise<number> {
    try {
      return await this.redisClient.expire(key, seconds);
    } catch (error) {
      this.logger.error(
        `Failed to set expiry for Redis key ${key}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw error;
    }
  }

  async setex(key: string, seconds: number, value: string): Promise<string> {
    try {
      return await this.redisClient.setex(key, seconds, value);
    } catch (error) {
      this.logger.error(
        `Failed to setex Redis key ${key}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw error;
    }
  }

  // Health check method
  async healthCheck(): Promise<{ status: string; latency: number }> {
    const start = Date.now();
    try {
      await this.ping();
      const latency = Date.now() - start;
      return { status: 'healthy', latency };
    } catch (error) {
      const latency = Date.now() - start;
      this.logger.error(
        `Redis health check failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return { status: 'unhealthy', latency };
    }
  }

  private createRedisClient(): Redis {
    const disableRedis = this.configService.get<boolean>('DISABLE_REDIS');

    if (disableRedis) {
      this.logger.warn('Redis is disabled via DISABLE_REDIS flag');
      // Return a mock Redis client with proper method implementations
      return new Proxy({} as Redis, {
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
    }

    const redisUrl = this.configService.get<string>('REDIS_URL');

    if (redisUrl) {
      this.logger.log('Connecting to Redis using URL...');
      return new Redis(redisUrl, {
        enableReadyCheck: false,
        maxRetriesPerRequest: null,
        lazyConnect: true,
        reconnectOnError: (err) => {
          this.logger.error(`Redis connection error: ${err.message}`);
          return err.message.includes('READONLY');
        },
      });
    }

    // Fallback to individual config parameters
    const host = this.configService.get<string>('REDIS_HOST', 'localhost');
    const port = this.configService.get<number>('REDIS_PORT', 6379);
    const password = this.configService.get<string>('REDIS_PASSWORD');
    const username = this.configService.get<string>('REDIS_USERNAME');

    this.logger.log(`Connecting to Redis at ${host}:${port}...`);

    return new Redis({
      host,
      port,
      password,
      username,
      enableReadyCheck: false,
      maxRetriesPerRequest: null,
      lazyConnect: true,
      reconnectOnError: (err) => {
        this.logger.error(`Redis connection error: ${err.message}`);
        return err.message.includes('READONLY');
      },
    });
  }
}
