import { Module } from '@nestjs/common';
import { DriverReviewService } from './driver-review.service';
import { DriverReviewResolver } from './driver-review.resolver';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [DriverReviewResolver, DriverReviewService],
  exports: [DriverReviewService],
})
export class DriverReviewModule {}
