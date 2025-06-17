import { Module } from '@nestjs/common';
import { BlogService } from './blog.service';
import { BlogController } from './blog.controller';
import { BlogMultilingualController } from './controllers/blog-multilingual.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../users/users.module';
import { I18nModule } from '../i18n/i18n.module'; // Re-enabled for multilingual support
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    I18nModule, // Re-enabled for multilingual support
    RedisModule,
  ],
  controllers: [BlogController, BlogMultilingualController],
  providers: [BlogService],
  exports: [BlogService],
})
export class BlogModule {}
