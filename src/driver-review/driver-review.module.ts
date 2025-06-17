import { Module } from '@nestjs/common';
import { DriverReviewService } from './driver-review.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [DriverReviewService],
  exports: [DriverReviewService],
})
export class DriverReviewModule {}
