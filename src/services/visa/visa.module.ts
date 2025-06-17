import { Module } from '@nestjs/common';
import { VisaService } from './visa.service';
import { VisaResolver } from './visa.resolver';
import { PrismaModule } from '../../prisma/prisma.module';
import { ServicesService } from '../services.service';

@Module({
  imports: [PrismaModule],
  providers: [VisaResolver, VisaService, ServicesService],
  exports: [VisaService],
})
export class VisaModule {}
