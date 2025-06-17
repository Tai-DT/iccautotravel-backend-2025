import { Injectable, Logger } from '@nestjs/common';
import { CircuitBreakerService } from './circuit-breaker.service';
import { UseCircuitBreaker } from '../decorators/circuit-breaker.decorator';

@Injectable()
export class ExampleExternalService {
  private readonly logger = new Logger(ExampleExternalService.name);

  constructor(private readonly circuitBreakerService: CircuitBreakerService) {}

  /**
   * Example: Call external payment API with circuit breaker protection
   */
  @UseCircuitBreaker({
    name: 'payment-gateway',
    failureThreshold: 3,
    recoveryTimeout: 30000, // 30 seconds
    successThreshold: 2,
  })
  async processPayment(amount: number, cardToken: string): Promise<any> {
    // Simulate external payment API call
    return this.circuitBreakerService.executeWithCircuitBreaker(
      'payment-gateway',
      async () => {
        this.logger.log(
          `Processing payment of ${amount} with token ${cardToken}`,
        );

        // Simulate random failures for demonstration
        if (Math.random() < 0.3) {
          throw new Error('Payment gateway timeout');
        }

        // Simulate slow response
        await new Promise((resolve) => setTimeout(resolve, 1000));

        return {
          transactionId: `tx_${Date.now()}`,
          status: 'success',
          amount,
        };
      },
      {
        failureThreshold: 3,
        recoveryTimeout: 30000,
        successThreshold: 2,
      },
    );
  }

  /**
   * Example: Call external notification service with circuit breaker
   */
  async sendNotification(userId: string, message: string): Promise<boolean> {
    try {
      await this.circuitBreakerService.executeWithCircuitBreaker(
        'notification-service',
        async () => {
          this.logger.log(`Sending notification to user ${userId}: ${message}`);

          // Simulate external notification API
          if (Math.random() < 0.2) {
            throw new Error('Notification service unavailable');
          }

          return { messageId: `msg_${Date.now()}`, sent: true };
        },
        {
          failureThreshold: 5,
          recoveryTimeout: 60000, // 1 minute
          successThreshold: 3,
        },
      );

      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send notification: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }

  /**
   * Example: Call external geocoding service
   */
  async geocodeAddress(address: string): Promise<any> {
    return this.circuitBreakerService.executeWithCircuitBreaker(
      'geocoding-service',
      async () => {
        this.logger.log(`Geocoding address: ${address}`);

        // Simulate external geocoding API
        if (Math.random() < 0.15) {
          throw new Error('Geocoding API rate limit exceeded');
        }

        await new Promise((resolve) => setTimeout(resolve, 500));

        return {
          latitude: 21.0285 + (Math.random() - 0.5) * 0.1,
          longitude: 105.8542 + (Math.random() - 0.5) * 0.1,
          address,
        };
      },
      {
        failureThreshold: 4,
        recoveryTimeout: 45000, // 45 seconds
      },
    );
  }

  /**
   * Example: Database backup operation with circuit breaker
   */
  async performDatabaseBackup(): Promise<boolean> {
    try {
      await this.circuitBreakerService.executeWithCircuitBreaker(
        'database-backup',
        async () => {
          this.logger.log('Starting database backup...');

          // Simulate long-running backup operation
          await new Promise((resolve) => setTimeout(resolve, 5000));

          // Simulate occasional backup failures
          if (Math.random() < 0.1) {
            throw new Error('Database backup failed - insufficient storage');
          }

          this.logger.log('Database backup completed successfully');
          return { backupId: `backup_${Date.now()}`, size: '2.5GB' };
        },
        {
          failureThreshold: 2,
          recoveryTimeout: 300000, // 5 minutes
          successThreshold: 1,
        },
      );

      return true;
    } catch (error) {
      this.logger.error(
        `Database backup failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }

  /**
   * Get all circuit health for this service
   */
  async getServiceCircuitHealth() {
    const circuits = [
      'payment-gateway',
      'notification-service',
      'geocoding-service',
      'database-backup',
    ];
    const health = {};

    for (const circuit of circuits) {
      try {
        health[circuit] =
          await this.circuitBreakerService.getCircuitHealth(circuit);
      } catch (error) {
        health[circuit] = {
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }

    return health;
  }
}
