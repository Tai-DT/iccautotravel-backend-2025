import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './prisma.service';
import { DatabaseManager } from './database-manager.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [PrismaService, DatabaseManager],
  exports: [PrismaService, DatabaseManager],
})
export class PrismaModule {}
