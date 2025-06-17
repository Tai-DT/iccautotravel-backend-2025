import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { PaymentResolver } from './payment.resolver';
import { VnpayStrategy } from './strategies/vnpay.strategy';
import { MomoStrategy } from './strategies/momo.strategy';
import { StripeStrategy } from './strategies/stripe.strategy';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [PrismaModule, ConfigModule, UsersModule, HttpModule],
  controllers: [PaymentController],
  providers: [
    PaymentService,
    PaymentResolver,
    VnpayStrategy,
    MomoStrategy,
    StripeStrategy,
  ],
  exports: [PaymentService],
})
export class PaymentModule {}
