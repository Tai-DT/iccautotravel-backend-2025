import { Module } from '@nestjs/common';
import { BusService } from './bus.service';
import { BusResolver } from './bus.resolver';
import { BusController } from './bus.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [BusController],
  providers: [BusResolver, BusService],
  exports: [BusService],
})
export class BusModule {}
