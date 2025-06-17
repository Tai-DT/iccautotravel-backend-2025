import { Module } from '@nestjs/common';
import { ComboService } from './combo.service';
import { ComboResolver } from './combo.resolver';
import { PrismaModule } from '../../prisma/prisma.module';
import { ServicesService } from '../services.service';

@Module({
  imports: [PrismaModule],
  providers: [ComboResolver, ComboService, ServicesService],
  exports: [ComboService],
})
export class ComboModule {}
