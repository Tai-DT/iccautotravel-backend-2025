import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DashboardMinimalModule } from './dashboard/dashboard-minimal.module';
import { ServicesModule } from './services/services.module';
import { BlogModule } from './blog/blog.module';
import { FaqModule } from './faq/faq.module';
import { CompanyInfoModule } from './company-info/company-info.module';
import { ContactModule } from './contact/contact.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    // Basic configuration
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
    }),

    // Event system
    EventEmitterModule.forRoot(),

    // Rate limiting (minimal config)
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),

    // Core modules
    PrismaModule,
    AuthModule,
    UsersModule,

    // Business modules
    DashboardMinimalModule,
    ServicesModule,
    BlogModule,
    FaqModule,
    CompanyInfoModule,
    ContactModule,

    // Health check
    HealthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppMinimalModule {}
