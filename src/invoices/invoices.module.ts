import { Module } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { InvoicesController } from './invoices.controller';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { InvoiceListeners } from './listeners/invoice.listeners';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [EventEmitterModule.forRoot(), PrismaModule],
  controllers: [InvoicesController],
  providers: [InvoicesService, InvoiceListeners],
  exports: [InvoicesService],
})
export class InvoicesModule {}
