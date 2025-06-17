import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { GoongService } from './goong.service';
import { GoongController } from './goong.controller';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [HttpModule, ConfigModule],
  controllers: [GoongController],
  providers: [GoongService],
  exports: [GoongService],
})
export class GoongModule {}
