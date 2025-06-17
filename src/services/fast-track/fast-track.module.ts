import { Module } from '@nestjs/common';
import { FastTrackService } from './fast-track.service';
import { FastTrackResolver } from './fast-track.resolver';
import { PrismaModule } from '../../prisma/prisma.module';
import { ServicesService } from '../services.service';

@Module({
  imports: [PrismaModule],
  providers: [FastTrackResolver, FastTrackService, ServicesService],
  exports: [FastTrackService],
})
export class FastTrackModule {}
