import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { DashboardController } from './dashboard.controller';
import { SecureDashboardController } from './dashboard-secure.controller';
import { DashboardService } from './dashboard.service';
import { PrismaModule } from '../prisma/prisma.module';
import { EnhancedPermissionsGuard } from '../auth/guards/enhanced-permissions-simple.guard';

@Module({
  imports: [
    PrismaModule,
    CacheModule.register({
      ttl: 300, // 5 minutes default
      max: 100, // maximum number of items in cache
    }),
  ],
  controllers: [DashboardController, SecureDashboardController],
  providers: [DashboardService, EnhancedPermissionsGuard],
  exports: [DashboardService],
})
export class DashboardMinimalModule {}
