import { Module } from '@nestjs/common';
import { ServicesService } from './services.service';
import { ServicesResolver } from './services.resolver';
import { ServicesController } from './services.controller';
import { ServicesMultilingualController } from './controllers/services-multilingual.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';
import { MockTranslationService } from './mock-translation.service';
import { I18nModule } from '../i18n/i18n.module'; // Import for multilingual support
import { VehicleModule } from './vehicle/vehicle.module';
import { FlightModule } from './flight/flight.module';
import { HotelModule } from './hotel/hotel.module';
import { TourModule } from './tour/tour.module';
import { VisaModule } from './visa/visa.module';
import { TransferModule } from './transfer/transfer.module';
import { FastTrackModule } from './fast-track/fast-track.module';
import { ComboModule } from './combo/combo.module';
import { DriverModule } from './driver/driver.module';
import { BusModule } from './bus/bus.module';

@Module({
  imports: [
    PrismaModule,
    RedisModule,
    I18nModule, // Added back for multilingual support
    VehicleModule,
    FlightModule,
    HotelModule,
    TourModule,
    VisaModule,
    TransferModule,
    FastTrackModule,
    ComboModule,
    DriverModule,
    BusModule,
  ],
  controllers: [ServicesController, ServicesMultilingualController],
  providers: [ServicesResolver, ServicesService, MockTranslationService],
  exports: [ServicesService],
})
export class ServicesModule {}
