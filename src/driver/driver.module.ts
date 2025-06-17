import { Module } from '@nestjs/common';
import { DriverController } from './driver.controller';
import { DriverService } from './driver.service';
import { DriverStatisticsService } from './driver-statistics.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DriverController],
  providers: [DriverService, DriverStatisticsService],
  exports: [DriverService, DriverStatisticsService],
})
export class DriverModule {}
