import { Module } from '@nestjs/common';
import { LocationsService } from './locations.service';
import { LocationsResolver } from './locations.resolver';
import { LocationsController } from './locations.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [LocationsController],
  providers: [LocationsService, LocationsResolver, PrismaService],
  exports: [LocationsService],
})
export class LocationsModule {}
