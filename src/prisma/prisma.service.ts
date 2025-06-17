import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  INestApplication,
  Logger,
} from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor(private configService: ConfigService) {
    // Sử dụng cấu hình dựa trên môi trường
    const url = configService.get('DATABASE_URL');
    const directUrl = configService.get('DIRECT_URL');
    const isProduction = configService.get('NODE_ENV') === 'production';

    // Enhanced Prisma configuration with connection pooling and error handling
    super({
      datasources: {
        db: { url },
      },
      // Enhanced logging configuration
      log: isProduction ? ['error'] : ['error', 'warn', 'info'],
      // Connection configuration for better reliability
      errorFormat: 'pretty',
    });

    this.logger.log(
      `Connecting to database with URL: ${url ? url.substring(0, 30) + '...' : 'undefined'}`,
    );
    if (directUrl) {
      this.logger.log(
        `Direct database URL is configured: ${directUrl.substring(0, 30) + '...'}`,
      );
    }
  }

  async onModuleInit() {
    this.logger.log('Initializing Prisma connection...');
    let connectionAttempts = 0;
    const maxAttempts = 3;
    const retryDelay = 2000; // 2 seconds

    while (connectionAttempts < maxAttempts) {
      try {
        await this.$connect();
        this.logger.log('Database connection established successfully');
        return;
      } catch (error: unknown) {
        connectionAttempts++;
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';

        this.logger.error(
          `Failed to connect to database (attempt ${connectionAttempts}/${maxAttempts}): ${errorMessage}`,
        );

        if (connectionAttempts < maxAttempts) {
          this.logger.log(`Retrying in ${retryDelay / 1000} seconds...`);
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
        } else {
          // Final attempt failed
          if (this.configService.get('NODE_ENV') === 'production') {
            this.logger.error(
              'Production environment: Database connection required. Terminating application.',
            );
            throw error;
          } else {
            this.logger.warn(
              'Development mode: Continuing with limited functionality due to DB connection issues',
            );
          }
        }
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  enableShutdownHooks(app: INestApplication) {
    // Sửa đổi: Không sử dụng Prisma $on('beforeExit') nữa mà chuyển sang dùng Node.js process events
    process.on('beforeExit', async () => {
      this.logger.log('Ứng dụng đang tắt, đóng kết nối...');
      await app.close();
    });
  }
}

// Re-export Prisma types
export type { Prisma };
