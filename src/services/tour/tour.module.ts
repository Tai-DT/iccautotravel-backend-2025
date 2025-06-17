import { Module } from '@nestjs/common';
import { TourService } from './tour.service';
import { TourResolver } from './tour.resolver';
import { PrismaModule } from '../../prisma/prisma.module';
import { ServicesService } from '../services.service';

@Module({
  imports: [PrismaModule],
  providers: [TourResolver, TourService, ServicesService],
  exports: [TourService],
})
export class TourModule {}
