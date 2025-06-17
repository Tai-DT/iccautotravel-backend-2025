import { Module } from '@nestjs/common';
import { VehicleSeatService } from './vehicle-seat.service';
import { VehicleSeatController } from './vehicle-seat.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    PrismaModule,
    CacheModule.register({
      ttl: 300, // 5 minutes default cache
    }),
  ],
  controllers: [VehicleSeatController],
  providers: [VehicleSeatService],
  exports: [VehicleSeatService],
})
export class VehicleSeatModule {}
