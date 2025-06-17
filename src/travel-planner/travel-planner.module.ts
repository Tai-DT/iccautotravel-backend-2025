import { Module } from '@nestjs/common';
import { TravelPlannerService } from './travel-planner.service';
import { TravelPlannerController } from './travel-planner.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AIModule } from '../ai/ai.module';
import { GoongModule } from '../goong/goong.module';

@Module({
  imports: [PrismaModule, AIModule, GoongModule],
  controllers: [TravelPlannerController],
  providers: [TravelPlannerService],
  exports: [TravelPlannerService],
})
export class TravelPlannerModule {}
