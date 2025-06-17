import { Module } from '@nestjs/common';
import { ItineraryService } from './itinerary.service';
import { ItineraryResolver } from './itinerary.resolver';
import { PrismaService } from '../prisma/prisma.service';
import { GoongModule } from '../goong/goong.module';
import { AIModule } from '../ai/ai.module';

@Module({
  imports: [GoongModule, AIModule],
  providers: [ItineraryService, ItineraryResolver, PrismaService],
  exports: [ItineraryService],
})
export class ItineraryModule {}
