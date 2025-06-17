import { Controller, Get } from '@nestjs/common';

@Controller('dashboard')
export class DashboardController {
  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  @Get('metrics')
  getMetrics() {
    return {
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      version: process.version,
    };
  }
}
