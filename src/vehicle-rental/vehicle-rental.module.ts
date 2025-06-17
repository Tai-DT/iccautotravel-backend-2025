import { Module } from '@nestjs/common';
import { VehicleRentalController } from './vehicle-rental.controller';
import { VehicleRentalService } from './vehicle-rental.service';
import { PriceCalculationService } from './price-calculation.service';
import { KmPriceCalculationService } from './km-price-calculation.service';
import { ConfigService } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { HttpModule } from '@nestjs/axios';
// import { I18nModule } from 'nestjs-i18n'; // Removed to fix dependency issues

@Module({
  imports: [PrismaModule, HttpModule], // I18nModule removed
  controllers: [VehicleRentalController],
  providers: [
    VehicleRentalService,
    PriceCalculationService,
    KmPriceCalculationService,
    ConfigService,
  ],
  exports: [
    VehicleRentalService,
    PriceCalculationService,
    KmPriceCalculationService,
  ],
})
export class VehicleRentalModule {}
