import { Module } from '@nestjs/common';
import { ServiceReviewService } from './service-review.service';
import { ServiceReviewController } from './service-review.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ServiceReviewController],
  providers: [ServiceReviewService],
  exports: [ServiceReviewService],
})
export class ReviewsModule {}
