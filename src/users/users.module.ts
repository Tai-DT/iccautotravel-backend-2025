import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UsersService } from './users.service';
import { UsersResolver } from './users.resolver';
import { UsersController } from './users.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { GraphQLJwtAuthGuard } from '../auth/guards/graphql-jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@Module({
  imports: [
    PrismaModule,
    AuditLogModule,
    JwtModule.register({}), // Import JwtModule for the guards
  ],
  controllers: [UsersController],
  providers: [UsersService, UsersResolver, GraphQLJwtAuthGuard, RolesGuard],
  exports: [UsersService],
})
export class UsersModule {}
