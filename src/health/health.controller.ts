import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  HttpHealthIndicator,
  DiskHealthIndicator,
  MemoryHealthIndicator,
} from '@nestjs/terminus';
import { PrismaService } from '../prisma/prisma.service';
import { DatabaseHealthService } from './database-health.service';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
    private disk: DiskHealthIndicator,
    private memory: MemoryHealthIndicator,
    private prisma: PrismaService,
    private databaseHealth: DatabaseHealthService,
  ) {}

  @Get()
  @HealthCheck()
  async check() {
    return this.health.check([
      // Enhanced database connectivity check
      async () => {
        const connectionStatus = this.databaseHealth.getConnectionStatus();
        const isHealthy = this.databaseHealth.isHealthy();

        try {
          await this.prisma.$queryRaw`SELECT 1`;
          return {
            database: {
              status: 'up',
              message: 'Database connection is healthy',
              connectionStatus,
              lastCheck: new Date().toISOString(),
            },
          };
        } catch (error: unknown) {
          return {
            database: {
              status: 'down',
              message: 'Database connection failed',
              error: error instanceof Error ? error.message : 'Unknown error',
              connectionStatus,
              isHealthy,
              lastCheck: new Date().toISOString(),
            },
          };
        }
      },
      // Check disk space
      () =>
        this.disk.checkStorage('storage', { path: '/', thresholdPercent: 0.9 }),
      // Check memory usage
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024), // 150MB
      // Check if the application can make HTTP requests
      () => this.http.pingCheck('nestjs-docs', 'https://docs.nestjs.com'),
    ]);
  }

  @Get('detailed')
  @HealthCheck()
  async detailedCheck() {
    const startTime = Date.now();
    const checks = await this.check();
    const responseTime = Date.now() - startTime;

    return {
      ...checks,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      responseTime: `${responseTime}ms`,
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version,
    };
  }
}
