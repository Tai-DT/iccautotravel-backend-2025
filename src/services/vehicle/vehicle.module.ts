import { Module, forwardRef } from '@nestjs/common';
import { VehicleService } from './vehicle.service';
import { VehicleResolver } from './vehicle.resolver';
import { PrismaModule } from '../../prisma/prisma.module';
import { DriverModule } from '../driver/driver.module';
import { ServicesModule } from '../services.module';
import { GoongModule } from '../../goong/goong.module';

@Module({
  imports: [
    PrismaModule,
    DriverModule,
    forwardRef(() => ServicesModule),
    GoongModule,
  ],
  providers: [VehicleResolver, VehicleService],
  exports: [VehicleService],
})
export class VehicleModule {}
