import { Module } from '@nestjs/common';
import { DriverService } from './driver.service';
import { DriverResolver } from './driver.resolver';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [DriverResolver, DriverService],
  exports: [DriverService],
})
export class DriverModule {}
