import { Module } from '@nestjs/common';
import { FlightService } from './flight.service';
import { FlightResolver } from './flight.resolver';
import { PrismaModule } from '../../prisma/prisma.module';
import { ServicesService } from '../services.service';

@Module({
  imports: [PrismaModule],
  providers: [FlightResolver, FlightService, ServicesService],
  exports: [FlightService],
})
export class FlightModule {}
