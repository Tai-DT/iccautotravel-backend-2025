import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class DatabaseHealthService {
  private readonly logger = new Logger(DatabaseHealthService.name);
  private isConnected = false;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private readonly reconnectDelay = 5000; // 5 seconds

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async checkDatabaseHealth() {
    try {
      // Simple query to check database connectivity
      await this.prisma.$queryRaw`SELECT 1`;

      if (!this.isConnected) {
        this.logger.log('Database connection restored');
        this.isConnected = true;
        this.reconnectAttempts = 0;
      }
    } catch (error) {
      this.isConnected = false;
      this.reconnectAttempts++;

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Database health check failed (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}): ${errorMessage}`,
      );

      if (this.reconnectAttempts <= this.maxReconnectAttempts) {
        await this.attemptReconnection();
      } else {
        this.logger.error(
          'Max reconnection attempts reached. Manual intervention required.',
        );
      }
    }
  }

  private async attemptReconnection() {
    try {
      this.logger.log('Attempting to reconnect to database...');
      await this.prisma.$disconnect();
      await new Promise((resolve) => setTimeout(resolve, this.reconnectDelay));
      await this.prisma.$connect();

      // Test the connection
      await this.prisma.$queryRaw`SELECT 1`;

      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.logger.log('Database reconnection successful');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Reconnection attempt failed: ${errorMessage}`);
    }
  }

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    maxRetries = 3,
  ): Promise<T | null> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await operation();
        if (attempt > 1) {
          this.logger.log(`${operationName} succeeded on attempt ${attempt}`);
        }
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');

        this.logger.warn(
          `${operationName} failed on attempt ${attempt}/${maxRetries}: ${lastError.message}`,
        );

        if (attempt < maxRetries) {
          // Wait before retrying, with exponential backoff
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          await new Promise((resolve) => setTimeout(resolve, delay));

          // Try to reconnect before next attempt
          if (!this.isConnected) {
            await this.attemptReconnection();
          }
        }
      }
    }

    this.logger.error(
      `${operationName} failed after ${maxRetries} attempts: ${lastError?.message}`,
    );
    return null;
  }

  isHealthy(): boolean {
    return this.isConnected;
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
    };
  }
}
