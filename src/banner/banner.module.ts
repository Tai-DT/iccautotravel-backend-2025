import { Module } from '@nestjs/common';
import { BannerService } from './banner.service';
import { BannerController } from './banner.controller';
import { BannerResolver } from './banner.resolver';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [BannerController],
  providers: [BannerService, BannerResolver],
  exports: [BannerService],
})
export class BannerModule {}
