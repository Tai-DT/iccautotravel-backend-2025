import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Patch,
  Query,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
  RawBody,
  Headers,
  Delete,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentEntity } from './entities/payment.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PaymentStatus } from '@prisma/client';

@ApiTags('payments')
@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new payment' })
  @ApiResponse({
    status: 201,
    description: 'Payment created successfully',
    type: PaymentEntity,
  })
  async createPayment(
    @Body() createPaymentDto: CreatePaymentDto,
    @CurrentUser() user: { id: string },
  ): Promise<PaymentEntity> {
    return this.paymentService.createPayment(createPaymentDto, user.id);
  }

  @Post('webhook/:provider')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle payment webhook' })
  async handleWebhook(
    @Param('provider') provider: string,
    @Body() data: any,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      let paymentData = data;

      // For GET requests (VNPay return), extract from query params
      if (req.method === 'GET') {
        paymentData = req.query;
      }

      // For Stripe, we need raw body for signature verification
      if (provider.toUpperCase() === 'STRIPE') {
        const signature = req.headers['stripe-signature'];
        if (signature) {
          // Handle Stripe webhook with signature verification
          // This would require the raw body middleware
          paymentData = { ...data, signature };
        }
      }

      const payment = await this.paymentService.verifyPayment(
        provider,
        paymentData,
      );

      // For VNPay, redirect to success/failure page
      if (provider.toUpperCase() === 'VNPAY' && req.method === 'GET') {
        const returnUrl = payment.metadata?.returnUrl || '/payment/success';
        return res.redirect(
          `${returnUrl}?status=${payment.status}&transactionId=${payment.txnRef}`,
        );
      }

      return res.json({
        success: true,
        payment,
      });
    } catch (error) {
      console.error('Payment webhook error:', error);

      if (provider.toUpperCase() === 'VNPAY' && req.method === 'GET') {
        const returnUrl = '/payment/failed';
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        return res.redirect(
          `${returnUrl}?error=${encodeURIComponent(errorMessage)}`,
        );
      }

      return res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  @Get('list')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all payments with pagination and filters' })
  @ApiResponse({
    status: 200,
    description: 'Payments retrieved successfully',
  })
  async getAllPayments(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('status') status?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.paymentService.findAll({
      page,
      limit,
      status: status as PaymentStatus,
      dateFrom,
      dateTo,
    });
  }

  @Get('methods')
  @ApiOperation({ summary: 'Get available payment methods' })
  getPaymentMethods() {
    return this.paymentService.getPaymentMethods();
  }

  @Get('booking/:bookingId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payments for a booking' })
  async getPaymentsByBooking(
    @Param('bookingId') bookingId: string,
  ): Promise<PaymentEntity[]> {
    return this.paymentService.findByBookingId(bookingId);
  }

  @Get('user/payments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user payments with pagination' })
  async getUserPayments(
    @CurrentUser() user: { id: string },
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.paymentService.findByUserId(user.id, page, limit);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment by ID' })
  async getPaymentById(@Param('id') id: string): Promise<PaymentEntity> {
    return this.paymentService.findById(id);
  }

  // VNPay return URL handler (GET request)
  @Get('vnpay/return')
  @ApiOperation({ summary: 'VNPay return URL handler' })
  async handleVnpayReturn(@Query() query: any, @Res() res: Response) {
    try {
      const payment = await this.paymentService.verifyPayment('VNPAY', query);
      const returnUrl = payment.metadata?.returnUrl || '/payment/success';
      return res.redirect(
        `${returnUrl}?status=${payment.status}&transactionId=${payment.txnRef}`,
      );
    } catch (error) {
      console.error('VNPay return error:', error);
      const returnUrl = '/payment/failed';
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return res.redirect(
        `${returnUrl}?error=${encodeURIComponent(errorMessage)}`,
      );
    }
  }

  // MoMo return URL handler
  @Post('momo/ipn')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'MoMo IPN handler' })
  async handleMomoIpn(@Body() data: any) {
    try {
      const payment = await this.paymentService.verifyPayment('MOMO', data);
      return {
        success: true,
        payment,
      };
    } catch (error) {
      console.error('MoMo IPN error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Stripe webhook handler
  @Post('stripe/webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Stripe webhook handler' })
  async handleStripeWebhook(
    @RawBody() rawBody: Buffer,
    @Headers('stripe-signature') signature: string,
  ) {
    try {
      // Process Stripe webhook event
      const data = {
        rawBody: rawBody.toString(),
        signature,
      };

      const payment = await this.paymentService.verifyPayment('STRIPE', data);
      return {
        success: true,
        payment,
      };
    } catch (error) {
      console.error('Stripe webhook error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Callback methods for tests compatibility
  @Get('vnpay/callback')
  @ApiOperation({ summary: 'VNPay callback handler' })
  async vnpayCallback(@Query() data: any) {
    return this.paymentService.verifyPayment('VNPAY', data);
  }

  @Post('momo/callback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'MoMo callback handler' })
  async momoCallback(@Body() data: any) {
    return this.paymentService.verifyPayment('MOMO', data);
  }

  @Post('stripe/callback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Stripe callback handler' })
  async stripeCallback(@Body() data: any) {
    return this.paymentService.verifyPayment('STRIPE', data);
  }

  // Compatibility method for tests
  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my payments' })
  async getMyPayments(@CurrentUser() user: { id: string }) {
    return this.paymentService.getPaymentsByUser(user.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update payment status' })
  @ApiResponse({ status: 200, description: 'Payment updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async updatePayment(
    @Param('id') id: string,
    @Body() updateData: { status?: string; metadata?: any },
    @CurrentUser() user: { id: string },
  ) {
    return await this.paymentService.updatePaymentStatus(
      id,
      updateData,
      user.id,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a payment' })
  @ApiResponse({ status: 200, description: 'Payment deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async deletePayment(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.paymentService.deletePayment(id, user.id);
  }
}
