import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';

export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

interface CircuitBreakerConfig {
  failureThreshold: number;
  recoveryTimeout: number;
  monitoringWindow: number;
  successThreshold: number; // For half-open state
}

interface CircuitMetrics {
  failures: number;
  successes: number;
  lastFailureTime: number;
  lastSuccessTime: number;
  state: CircuitState;
  totalRequests: number;
  consecutiveSuccesses: number; // For half-open recovery
}

interface CircuitStats {
  name: string;
  state: CircuitState;
  failures: number;
  successes: number;
  totalRequests: number;
  failureRate: number;
  uptime: number;
  lastFailure: Date | null;
  lastSuccess: Date | null;
  nextRetryTime: Date | null;
}

@Injectable()
export class CircuitBreakerService {
  private readonly logger = new Logger('CircuitBreaker');
  private readonly circuits = new Map<string, CircuitMetrics>();

  private readonly defaultConfig: CircuitBreakerConfig = {
    failureThreshold: 5, // 5 failures to open circuit
    recoveryTimeout: 60000, // 1 minute recovery time
    monitoringWindow: 300000, // 5 minute monitoring window
    successThreshold: 3, // 3 consecutive successes to close from half-open
  };

  constructor(private readonly redisService: RedisService) {}

  /**
   * Execute operation with circuit breaker protection
   */
  async executeWithCircuitBreaker<T>(
    circuitName: string,
    operation: () => Promise<T>,
    config: Partial<CircuitBreakerConfig> = {},
  ): Promise<T> {
    const finalConfig = { ...this.defaultConfig, ...config };
    const state = await this.getCircuitState(circuitName);

    // Check if circuit is open
    if (state === CircuitState.OPEN) {
      const canAttemptRecovery = await this.canAttemptRecovery(
        circuitName,
        finalConfig,
      );
      if (!canAttemptRecovery) {
        const nextRetry = await this.getNextRetryTime(circuitName, finalConfig);
        throw new Error(
          `Circuit breaker "${circuitName}" is OPEN - service unavailable. Next retry: ${nextRetry.toISOString()}`,
        );
      }
      // Set to half-open for recovery attempt
      await this.setState(circuitName, CircuitState.HALF_OPEN);
    }

    const startTime = Date.now();
    try {
      const result = await Promise.race([
        operation(),
        this.createTimeoutPromise(finalConfig.recoveryTimeout),
      ]);

      const executionTime = Date.now() - startTime;
      await this.recordSuccess(circuitName, finalConfig, executionTime);
      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      await this.recordFailure(circuitName, finalConfig, error, executionTime);
      throw error;
    }
  }

  /**
   * Create timeout promise for operation timeout
   */
  private createTimeoutPromise(timeout: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(
          new Error(`Circuit breaker operation timeout after ${timeout}ms`),
        );
      }, timeout);
    });
  }

  /**
   * Get current circuit state
   */
  private async getCircuitState(circuitName: string): Promise<CircuitState> {
    try {
      const metrics = await this.getMetrics(circuitName);
      return metrics.state;
    } catch {
      return CircuitState.CLOSED; // Default state
    }
  }

  /**
   * Get or initialize circuit metrics
   */
  private async getMetrics(circuitName: string): Promise<CircuitMetrics> {
    const key = `circuit:${circuitName}`;
    const cached = await this.redisService.getJson<CircuitMetrics>(key);

    if (cached) {
      // Update in-memory cache
      this.circuits.set(circuitName, cached);
      return cached;
    }

    // Initialize new circuit
    const metrics: CircuitMetrics = {
      failures: 0,
      successes: 0,
      lastFailureTime: 0,
      lastSuccessTime: 0,
      state: CircuitState.CLOSED,
      totalRequests: 0,
      consecutiveSuccesses: 0,
    };

    await this.saveMetrics(circuitName, metrics);
    this.circuits.set(circuitName, metrics);
    return metrics;
  }

  /**
   * Save metrics to Redis and in-memory cache
   */
  private async saveMetrics(
    circuitName: string,
    metrics: CircuitMetrics,
  ): Promise<void> {
    const key = `circuit:${circuitName}`;
    await this.redisService.setJson(key, metrics, 3600); // Keep for 1 hour
    this.circuits.set(circuitName, metrics);
  }

  /**
   * Set circuit state
   */
  private async setState(
    circuitName: string,
    state: CircuitState,
  ): Promise<void> {
    const metrics = await this.getMetrics(circuitName);
    const previousState = metrics.state;
    metrics.state = state;

    if (state === CircuitState.HALF_OPEN) {
      metrics.consecutiveSuccesses = 0;
    }

    await this.saveMetrics(circuitName, metrics);

    if (previousState !== state) {
      this.logger.log(
        `Circuit "${circuitName}" state changed: ${previousState} -> ${state}`,
      );

      // Log additional context for state changes
      if (state === CircuitState.OPEN) {
        this.logger.warn(
          `Circuit "${circuitName}" OPENED - failure threshold exceeded (${metrics.failures} failures)`,
        );
      } else if (
        state === CircuitState.CLOSED &&
        previousState === CircuitState.HALF_OPEN
      ) {
        this.logger.log(
          `Circuit "${circuitName}" CLOSED - recovery successful`,
        );
      }
    }
  }

  /**
   * Record successful operation
   */
  private async recordSuccess(
    circuitName: string,
    config: CircuitBreakerConfig,
    executionTime: number,
  ): Promise<void> {
    const metrics = await this.getMetrics(circuitName);
    metrics.successes++;
    metrics.totalRequests++;
    metrics.lastSuccessTime = Date.now();

    if (metrics.state === CircuitState.HALF_OPEN) {
      metrics.consecutiveSuccesses++;
      // Close circuit if enough consecutive successes
      if (metrics.consecutiveSuccesses >= config.successThreshold) {
        metrics.state = CircuitState.CLOSED;
        metrics.failures = 0; // Reset failure count
        this.logger.log(
          `Circuit "${circuitName}" recovered - state reset to CLOSED after ${metrics.consecutiveSuccesses} successes`,
        );
      }
    }

    await this.saveMetrics(circuitName, metrics);

    // Log slow operations even if successful
    if (executionTime > 5000) {
      this.logger.warn(
        `Slow operation in circuit "${circuitName}": ${executionTime}ms`,
      );
    }
  }

  /**
   * Record failed operation
   */
  private async recordFailure(
    circuitName: string,
    config: CircuitBreakerConfig,
    error: any,
    executionTime: number,
  ): Promise<void> {
    const metrics = await this.getMetrics(circuitName);
    metrics.failures++;
    metrics.totalRequests++;
    metrics.lastFailureTime = Date.now();
    metrics.consecutiveSuccesses = 0; // Reset consecutive successes

    // Open circuit if failure threshold exceeded
    if (
      metrics.state !== CircuitState.OPEN &&
      metrics.failures >= config.failureThreshold
    ) {
      metrics.state = CircuitState.OPEN;
      this.logger.error(
        `Circuit "${circuitName}" OPENED - failure threshold exceeded (${metrics.failures}/${config.failureThreshold})`,
        {
          error: error.message,
          executionTime,
          totalRequests: metrics.totalRequests,
          failureRate: `${((metrics.failures / metrics.totalRequests) * 100).toFixed(2)}%`,
        },
      );
    } else if (metrics.state === CircuitState.HALF_OPEN) {
      // If failed in half-open, go back to open
      metrics.state = CircuitState.OPEN;
      this.logger.warn(
        `Circuit "${circuitName}" failed during recovery - returning to OPEN state`,
      );
    } else {
      this.logger.warn(
        `Circuit "${circuitName}" failure recorded (${metrics.failures}/${config.failureThreshold})`,
        {
          error: error.message,
          executionTime,
        },
      );
    }

    await this.saveMetrics(circuitName, metrics);
  }

  /**
   * Check if recovery attempt can be made
   */
  private async canAttemptRecovery(
    circuitName: string,
    config: CircuitBreakerConfig,
  ): Promise<boolean> {
    const metrics = await this.getMetrics(circuitName);
    const timeSinceLastFailure = Date.now() - metrics.lastFailureTime;
    return timeSinceLastFailure >= config.recoveryTimeout;
  }

  /**
   * Get next retry time for an open circuit
   */
  private async getNextRetryTime(
    circuitName: string,
    config: CircuitBreakerConfig,
  ): Promise<Date> {
    const metrics = await this.getMetrics(circuitName);
    return new Date(metrics.lastFailureTime + config.recoveryTimeout);
  }

  /**
   * Get circuit health information
   */
  async getCircuitHealth(circuitName: string): Promise<CircuitStats> {
    const metrics = await this.getMetrics(circuitName);
    const totalRequests = metrics.failures + metrics.successes;
    const failureRate =
      totalRequests > 0 ? (metrics.failures / totalRequests) * 100 : 0;

    return {
      name: circuitName,
      state: metrics.state,
      failures: metrics.failures,
      successes: metrics.successes,
      totalRequests: metrics.totalRequests,
      failureRate: Math.round(failureRate * 100) / 100,
      uptime: metrics.state === CircuitState.CLOSED ? 100 : 0,
      lastFailure:
        metrics.lastFailureTime > 0 ? new Date(metrics.lastFailureTime) : null,
      lastSuccess:
        metrics.lastSuccessTime > 0 ? new Date(metrics.lastSuccessTime) : null,
      nextRetryTime:
        metrics.state === CircuitState.OPEN
          ? await this.getNextRetryTime(circuitName, this.defaultConfig)
          : null,
    };
  }

  /**
   * Get health information for all circuits
   */
  async getAllCircuitsHealth(): Promise<Record<string, CircuitStats>> {
    try {
      const keys = await this.redisService.keys('circuit:*');
      const circuits: Record<string, CircuitStats> = {};

      for (const key of keys) {
        const circuitName = key.replace('circuit:', '');
        circuits[circuitName] = await this.getCircuitHealth(circuitName);
      }

      return circuits;
    } catch (error) {
      this.logger.error('Error getting all circuits health:', error);
      return {};
    }
  }

  /**
   * Manually force circuit to open state
   */
  async forceOpenCircuit(circuitName: string, reason?: string): Promise<void> {
    await this.setState(circuitName, CircuitState.OPEN);
    this.logger.warn(
      `Circuit "${circuitName}" manually opened${reason ? `: ${reason}` : ''}`,
    );
  }

  /**
   * Manually force circuit to closed state
   */
  async forceCloseCircuit(circuitName: string, reason?: string): Promise<void> {
    const metrics = await this.getMetrics(circuitName);
    metrics.failures = 0;
    metrics.consecutiveSuccesses = 0;
    metrics.state = CircuitState.CLOSED;
    await this.saveMetrics(circuitName, metrics);
    this.logger.log(
      `Circuit "${circuitName}" manually closed and reset${
        reason ? `: ${reason}` : ''
      }`,
    );
  }

  /**
   * Reset circuit metrics
   */
  async resetCircuit(circuitName: string): Promise<void> {
    const metrics: CircuitMetrics = {
      failures: 0,
      successes: 0,
      lastFailureTime: 0,
      lastSuccessTime: 0,
      state: CircuitState.CLOSED,
      totalRequests: 0,
      consecutiveSuccesses: 0,
    };

    await this.saveMetrics(circuitName, metrics);
    this.logger.log(`Circuit "${circuitName}" reset to default state`);
  }

  /**
   * Get circuit statistics for monitoring
   */
  async getCircuitStatistics(): Promise<{
    totalCircuits: number;
    openCircuits: number;
    halfOpenCircuits: number;
    closedCircuits: number;
    totalFailures: number;
    totalSuccesses: number;
    averageFailureRate: number;
  }> {
    const allCircuits = await this.getAllCircuitsHealth();
    const circuits = Object.values(allCircuits);

    const stats = {
      totalCircuits: circuits.length,
      openCircuits: circuits.filter((c) => c.state === CircuitState.OPEN)
        .length,
      halfOpenCircuits: circuits.filter(
        (c) => c.state === CircuitState.HALF_OPEN,
      ).length,
      closedCircuits: circuits.filter((c) => c.state === CircuitState.CLOSED)
        .length,
      totalFailures: circuits.reduce((sum, c) => sum + c.failures, 0),
      totalSuccesses: circuits.reduce((sum, c) => sum + c.successes, 0),
      averageFailureRate: 0,
    };

    if (circuits.length > 0) {
      stats.averageFailureRate =
        circuits.reduce((sum, c) => sum + c.failureRate, 0) / circuits.length;
    }

    return stats;
  }

  /**
   * Get circuit breaker dashboard metrics
   */
  async getDashboardMetrics(): Promise<{
    overview: {
      totalCircuits: number;
      healthyCircuits: number;
      degradedCircuits: number;
      failedCircuits: number;
      overallHealth: number;
    };
    topFailingCircuits: Array<{
      name: string;
      failures: number;
      failureRate: number;
      state: CircuitState;
    }>;
    recentStateChanges: Array<{
      circuitName: string;
      fromState: CircuitState;
      toState: CircuitState;
      timestamp: Date;
    }>;
  }> {
    const allCircuits = await this.getAllCircuitsHealth();
    const circuits = Object.values(allCircuits);

    const overview = {
      totalCircuits: circuits.length,
      healthyCircuits: circuits.filter((c) => c.state === CircuitState.CLOSED)
        .length,
      degradedCircuits: circuits.filter(
        (c) => c.state === CircuitState.HALF_OPEN,
      ).length,
      failedCircuits: circuits.filter((c) => c.state === CircuitState.OPEN)
        .length,
      overallHealth: 0,
    };

    // Calculate overall health percentage
    if (circuits.length > 0) {
      overview.overallHealth = Math.round(
        (overview.healthyCircuits / circuits.length) * 100,
      );
    }

    // Top failing circuits
    const topFailingCircuits = circuits
      .filter((c) => c.failures > 0)
      .sort((a, b) => b.failureRate - a.failureRate)
      .slice(0, 5)
      .map((c) => ({
        name: c.name,
        failures: c.failures,
        failureRate: c.failureRate,
        state: c.state,
      }));

    return {
      overview,
      topFailingCircuits,
      recentStateChanges: [], // This would require state change history tracking
    };
  }

  /**
   * Test circuit breaker functionality
   */
  async testCircuit(circuitName: string): Promise<{
    result: string;
    metrics: CircuitStats;
    recommendations: string[];
  }> {
    const recommendations: string[] = [];
    let result = 'Circuit test completed';

    try {
      // Test with a simple operation
      await this.executeWithCircuitBreaker(circuitName, async () => {
        // Simulate operation
        await new Promise((resolve) => setTimeout(resolve, 100));
        return 'Test operation successful';
      });

      const metrics = await this.getCircuitHealth(circuitName);

      // Generate recommendations based on metrics
      if (metrics.failureRate > 50) {
        recommendations.push(
          'High failure rate detected - consider reviewing service dependencies',
        );
      }

      if (metrics.state === CircuitState.OPEN) {
        recommendations.push(
          'Circuit is currently open - check service health',
        );
      }

      if (metrics.totalRequests === 0) {
        recommendations.push(
          'No requests recorded - circuit may not be in use',
        );
      }

      return {
        result,
        metrics,
        recommendations,
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      result = `Circuit test failed: ${errorMessage}`;
      const metrics = await this.getCircuitHealth(circuitName);
      recommendations.push(
        'Test operation failed - check circuit configuration',
      );

      return {
        result,
        metrics,
        recommendations,
      };
    }
  }

  /**
   * Bulk operations for circuit management
   */
  async bulkOperations(
    operation: 'reset' | 'open' | 'close',
    circuitNames: string[],
  ): Promise<{
    success: string[];
    failed: Array<{ name: string; error: string }>;
  }> {
    const success: string[] = [];
    const failed: Array<{ name: string; error: string }> = [];

    for (const circuitName of circuitNames) {
      try {
        switch (operation) {
          case 'reset':
            await this.resetCircuit(circuitName);
            break;
          case 'open':
            await this.forceOpenCircuit(circuitName, 'Bulk operation');
            break;
          case 'close':
            await this.forceCloseCircuit(circuitName, 'Bulk operation');
            break;
        }
        success.push(circuitName);
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        failed.push({
          name: circuitName,
          error: errorMessage,
        });
      }
    }

    this.logger.log(
      `Bulk ${operation} operation completed: ${success.length} successful, ${failed.length} failed`,
    );

    return { success, failed };
  }

  /**
   * Export circuit configuration for backup
   */
  async exportConfiguration(): Promise<{
    timestamp: Date;
    defaultConfig: CircuitBreakerConfig;
    circuits: Array<{ name: string; metrics: CircuitMetrics }>;
  }> {
    const allCircuits = await this.getAllCircuitsHealth();
    const circuits = [];

    for (const [name] of Object.entries(allCircuits)) {
      const metrics = await this.getMetrics(name);
      circuits.push({ name, metrics });
    }

    return {
      timestamp: new Date(),
      defaultConfig: this.defaultConfig,
      circuits,
    };
  }

  /**
   * Clean up old circuit data
   */
  async cleanupOldCircuits(
    maxAge: number = 24 * 60 * 60 * 1000,
  ): Promise<number> {
    try {
      const keys = await this.redisService.keys('circuit:*');
      let cleanedCount = 0;

      for (const key of keys) {
        const metrics = await this.redisService.getJson<CircuitMetrics>(key);
        if (metrics) {
          const lastActivity = Math.max(
            metrics.lastFailureTime,
            metrics.lastSuccessTime,
          );
          if (lastActivity > 0 && Date.now() - lastActivity > maxAge) {
            await this.redisService.del(key);
            const circuitName = key.replace('circuit:', '');
            this.circuits.delete(circuitName);
            cleanedCount++;
          }
        }
      }

      if (cleanedCount > 0) {
        this.logger.log(
          `Cleaned up ${cleanedCount} old circuit breaker entries`,
        );
      }

      return cleanedCount;
    } catch (error) {
      this.logger.error('Error cleaning up old circuits:', error);
      return 0;
    }
  }
}
