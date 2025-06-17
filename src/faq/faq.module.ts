import { Module } from '@nestjs/common';
import { FaqService } from './faq.service';
import { FaqController } from './faq.controller';
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
  ],
  controllers: [FaqController],
  providers: [FaqService],
  exports: [FaqService],
})
export class FaqModule {}
