import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { SmartCacheService } from '../services/smart-cache.service';

@Module({
  imports: [
    CacheModule.register({
      ttl: 60, // 60 seconds
      max: 100, // max number of items in cache
    }),
  ],
  providers: [SmartCacheService],
  exports: [SmartCacheService, CacheModule],
})
export class AdvancedCacheModule {}
