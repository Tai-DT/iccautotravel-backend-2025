import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentEntity } from './entities/payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentMethodDto } from './dto/payment-method.dto';
import { GraphQLAuthGuard } from '../auth/guards/graphql-auth.guard';

@Resolver(() => PaymentEntity)
export class PaymentResolver {
  constructor(private readonly paymentService: PaymentService) {}

  @Mutation(() => PaymentEntity)
  @UseGuards(GraphQLAuthGuard)
  async createPayment(
    @Args('createPaymentInput') createPaymentDto: CreatePaymentDto,
    @Context() context: any,
  ): Promise<PaymentEntity> {
    const user = context.req.user;
    return this.paymentService.createPayment(createPaymentDto, user.id);
  }

  @Query(() => [PaymentEntity])
  @UseGuards(GraphQLAuthGuard)
  async paymentsByBooking(
    @Args('bookingId') bookingId: string,
  ): Promise<PaymentEntity[]> {
    return this.paymentService.findByBookingId(bookingId);
  }

  @Query(() => PaymentEntity)
  @UseGuards(GraphQLAuthGuard)
  async payment(@Args('id') id: string): Promise<PaymentEntity> {
    return this.paymentService.findById(id);
  }

  @Query(() => [PaymentMethodDto])
  paymentMethods(): PaymentMethodDto[] {
    return this.paymentService.getPaymentMethods();
  }
}
