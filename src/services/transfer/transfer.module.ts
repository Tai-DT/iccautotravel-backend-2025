import { Module } from '@nestjs/common';
import { TransferService } from './transfer.service';
import { TransferResolver } from './transfer.resolver';
import { PrismaModule } from '../../prisma/prisma.module';
import { ServicesService } from '../services.service';

@Module({
  imports: [PrismaModule],
  providers: [TransferResolver, TransferService, ServicesService],
  exports: [TransferService],
})
export class TransferModule {}
