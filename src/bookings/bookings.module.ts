import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt'; // Add this import
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { BookingListeners } from './listeners/booking.listeners';
import { PrismaModule } from '../prisma/prisma.module';
import { HealthModule } from '../health/health.module';
import { BookingsResolver } from './bookings.resolver'; // Add this import
import { GraphQLJwtAuthGuard } from '../auth/guards/graphql-jwt-auth.guard'; // Add this import
import { RolesGuard } from '../auth/guards/roles.guard'; // Add this import
import { DriverModule } from '../services/driver/driver.module';
import { NotificationModule } from '../notifications/notification.module';
import { NotificationService } from '../notifications/notification.service';
import { ScheduleModule } from '@nestjs/schedule';
import { AuditLogModule } from '../audit-log/audit-log.module'; // Add this import

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    PrismaModule,
    HealthModule,
    JwtModule.register({}), // Add this for GraphQLJwtAuthGuard
    DriverModule,
    NotificationModule,
    ScheduleModule.forRoot(),
    AuditLogModule, // Add this to provide AuditLogService
  ],
  controllers: [BookingsController],
  providers: [
    BookingsService,
    BookingListeners,
    BookingsResolver, // Add this
    GraphQLJwtAuthGuard, // Add this
    RolesGuard, // Add this
    NotificationService,
  ],
  exports: [BookingsService],
})
export class BookingsModule {}
