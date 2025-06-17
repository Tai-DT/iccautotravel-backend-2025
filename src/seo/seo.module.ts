import { Module } from '@nestjs/common';
import { SEOService } from './seo.service';
import { SEOController } from './seo.controller';
import { SEOResolver } from './seo.resolver';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SEOController],
  providers: [SEOService, SEOResolver],
  exports: [SEOService],
})
export class SEOModule {}
