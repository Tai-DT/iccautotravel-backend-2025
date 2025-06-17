import { Module } from '@nestjs/common';
import { InsuranceService } from './insurance.service';
import { InsuranceResolver } from './insurance.resolver';
import { PrismaModule } from '../../prisma/prisma.module';
import { ServicesService } from '../services.service';

@Module({
  imports: [PrismaModule],
  providers: [InsuranceResolver, InsuranceService, ServicesService],
  exports: [InsuranceService],
})
export class InsuranceModule {}
