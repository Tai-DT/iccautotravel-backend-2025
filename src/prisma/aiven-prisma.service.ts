import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient as AivenPrismaClient } from '@generated/aiven-client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AivenPrismaService
  extends AivenPrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(private configService: ConfigService) {
    const aivenDatabaseUrl = configService.get<string>('AIVEN_DATABASE_URL');

    if (!aivenDatabaseUrl) {
      throw new Error('AIVEN_DATABASE_URL is not configured');
    }

    const isDevelopment =
      configService.get<string>('NODE_ENV') === 'development';

    super({
      datasources: {
        db: {
          url: aivenDatabaseUrl,
        },
      },
      log: isDevelopment
        ? [
            { emit: 'stdout', level: 'query' },
            { emit: 'stdout', level: 'info' },
            { emit: 'stdout', level: 'warn' },
            { emit: 'stdout', level: 'error' },
          ]
        : [{ emit: 'stdout', level: 'error' }],
    });
  }

  async onModuleInit() {
    const maxRetries = 3;
    let retries = 0;

    while (retries < maxRetries) {
      try {
        await this.$connect();
        console.log('✅ Aiven database connected successfully');
        return;
      } catch (error) {
        retries++;
        console.error(
          `❌ Failed to connect to Aiven database (attempt ${retries}/${maxRetries}):`,
          error,
        );

        if (retries >= maxRetries) {
          throw new Error(
            `Failed to connect to Aiven database after ${maxRetries} attempts: ${error instanceof Error ? error.message : String(error)}`,
          );
        }

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, 2000 * retries));
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    console.log('🔌 Aiven database disconnected');
  }

  // Health check method
  async healthCheck(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      console.error('Aiven database health check failed:', error);
      return false;
    }
  }
}
