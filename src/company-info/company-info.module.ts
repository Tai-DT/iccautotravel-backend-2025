import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { CompanyInfoService } from './company-info.service';
import { CompanyInfoController } from './company-info.controller';
import { AboutUsController } from './about-us.controller';
import { AboutUsService } from './about-us.service';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../users/users.module';
// import { I18nCustomModule } from '../i18n/i18n.module'; // Disabled to fix dependency issues
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    // I18nCustomModule, // Disabled to fix dependency issues
    RedisModule,
    CacheModule.register(),
  ],
  controllers: [CompanyInfoController, AboutUsController],
  providers: [CompanyInfoService, AboutUsService],
  exports: [CompanyInfoService, AboutUsService],
})
export class CompanyInfoModule {}
