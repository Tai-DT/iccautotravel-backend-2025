import { Module } from '@nestjs/common';
import { HotelService } from './hotel.service';
import { HotelResolver } from './hotel.resolver';
import { PrismaModule } from '../../prisma/prisma.module';
import { ServicesService } from '../services.service';

@Module({
  imports: [PrismaModule],
  providers: [HotelResolver, HotelService, ServicesService],
  exports: [HotelService],
})
export class HotelModule {}
