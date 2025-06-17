import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentEntity } from './entities/payment.entity';
import { PaymentFilterDto } from './dto/payment-filter.dto';
import { PaginationOptionsDto } from '../common/dto/pagination.dto';
import { PaymentStatsDto } from './dto/payment-stats.dto';
import { DatabaseException } from '../common/exceptions/database.exception';
import { v4 as uuidv4 } from 'uuid';
import { PaymentStatus } from '@prisma/client';
import { PaymentStrategy } from './strategies/payment-strategy.interface';
import { VnpayStrategy } from './strategies/vnpay.strategy';
import { MomoStrategy } from './strategies/momo.strategy';
import { StripeStrategy } from './strategies/stripe.strategy';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentRequest } from './interfaces/payment-request.interface';

@Injectable()
export class PaymentService {
  private strategies: Map<string, PaymentStrategy> = new Map();
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private prisma: PrismaService,
    private vnpayStrategy: VnpayStrategy,
    private momoStrategy: MomoStrategy,
    private stripeStrategy: StripeStrategy,
  ) {
    this.strategies.set('VNPAY', this.vnpayStrategy);
    this.strategies.set('MOMO', this.momoStrategy);
    this.strategies.set('STRIPE', this.stripeStrategy);
  }

  async createPayment(
    createPaymentDto: CreatePaymentDto,
    userId: string,
  ): Promise<PaymentEntity> {
    try {
      // Verify booking exists
      const booking = await this.prisma.booking.findUnique({
        where: {
          id: createPaymentDto.bookingId,
        },
      });

      if (!booking) {
        throw new NotFoundException('Booking not found');
      }

      // Check if user has permission to create payment for this booking
      if (booking.userId !== userId) {
        // Check if current user is admin/staff
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          select: {
            roleId: true,
            email: true,
            Role: { select: { name: true } },
          },
        });

        if (!user) {
          throw new NotFoundException('User not found');
        }

        const roleName = user.Role?.name?.toUpperCase();
        if (roleName !== 'ADMIN' && roleName !== 'STAFF') {
          throw new ConflictException(
            'Bạn không có quyền tạo thanh toán cho booking này',
          );
        }
      }

      // Check if payment already exists for this booking (idempotency)
      const existingPayment = await this.prisma.payment.findFirst({
        where: {
          bookingId: createPaymentDto.bookingId,
          status: 'PAID',
        },
      });

      if (existingPayment) {
        throw new ConflictException(
          'Payment already completed for this booking',
        );
      }

      // Handle manual payments differently (skip strategy validation)
      if (createPaymentDto.provider.toLowerCase() === 'manual') {
        // For manual payments, create payment record directly without external provider
        const transactionId = `MANUAL_${Date.now()}_${uuidv4().slice(0, 8)}`;
        const payment = await this.prisma.payment.create({
          data: {
            id: uuidv4(),
            bookingId: createPaymentDto.bookingId,
            provider: 'manual',
            txnRef: transactionId,
            amount: createPaymentDto.amount,
            currency: createPaymentDto.currency || 'VND',
            status: PaymentStatus.PAID, // Manual payments are considered paid immediately
            paidAt: new Date(),
            updatedAt: new Date(),
            metadata: JSON.stringify({
              paymentType: 'manual',
              customerInfo: {
                name: createPaymentDto.customerName,
                email: createPaymentDto.customerEmail,
                phone: createPaymentDto.customerPhone,
              },
              ...(typeof createPaymentDto.metadata === 'object'
                ? createPaymentDto.metadata
                : createPaymentDto.metadata
                  ? { customMetadata: createPaymentDto.metadata }
                  : {}),
            }),
          },
        });

        // Update booking status to PAID for manual payments
        await this.prisma.booking.update({
          where: { id: createPaymentDto.bookingId },
          data: {
            paymentStatus: PaymentStatus.PAID,
            status: 'CONFIRMED',
          },
        });

        this.logger.log(
          `Created manual payment for booking ${createPaymentDto.bookingId}`,
        );
        return this.toPaymentEntity(payment);
      }

      const strategy = this.strategies.get(createPaymentDto.provider);
      if (!strategy) {
        throw new BadRequestException(
          `Payment provider ${createPaymentDto.provider} not supported`,
        );
      }

      // Unique transaction reference
      const transactionId = `${createPaymentDto.provider}_${Date.now()}_${uuidv4().slice(0, 8)}`;

      const paymentRequest: PaymentRequest = {
        amount: createPaymentDto.amount,
        currency: createPaymentDto.currency || 'VND',
        orderId: transactionId,
        returnUrl: createPaymentDto.returnUrl,
        cancelUrl: createPaymentDto.cancelUrl || createPaymentDto.returnUrl,
        description:
          createPaymentDto.description || `Payment for booking ${booking.id}`,
        customerInfo: {
          name: createPaymentDto.customerName,
          email: createPaymentDto.customerEmail,
          phone: createPaymentDto.customerPhone,
        },
        metadata: {
          bookingId: createPaymentDto.bookingId,
          userId: userId,
          ...(typeof createPaymentDto.metadata === 'object'
            ? createPaymentDto.metadata
            : createPaymentDto.metadata
              ? { customMetadata: createPaymentDto.metadata }
              : {}),
        },
      };

      const paymentResponse = await strategy.createPayment(paymentRequest);

      if (!paymentResponse.success) {
        throw new BadRequestException(
          `Payment creation failed: ${paymentResponse.error}`,
        );
      }

      // Save payment record to database
      const payment = await this.prisma.payment.create({
        data: {
          id: uuidv4(),
          bookingId: createPaymentDto.bookingId,
          provider: createPaymentDto.provider,
          txnRef: transactionId,
          amount: createPaymentDto.amount,
          currency: createPaymentDto.currency || 'VND',
          status: PaymentStatus.UNPAID,
          updatedAt: new Date(),
          metadata: JSON.stringify({
            paymentUrl: paymentResponse.paymentUrl,
            providerResponse: paymentResponse.data,
            customerInfo: paymentRequest.customerInfo || null,
          }),
        },
      });

      this.logger.log(
        `Created payment for booking ${createPaymentDto.bookingId}`,
      );
      return this.toPaymentEntity(payment);
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(
          `Failed to create payment: ${error.message}`,
          error.stack,
        );
      } else {
        this.logger.error('Failed to create payment: Unknown error');
      }
      throw error;
    }
  }

  async createPaymentFromBooking(booking: any): Promise<PaymentEntity> {
    try {
      // Kiểm tra nếu booking đã có payment
      const existingPayment = await this.prisma.payment.findFirst({
        where: {
          bookingId: booking.id,
        },
      });

      if (existingPayment) {
        this.logger.warn(`Payment already exists for booking ${booking.id}`);
        return this.toPaymentEntity(existingPayment);
      }

      const paymentId = uuidv4();

      // Map booking data to payment object according to Prisma schema
      const paymentData = {
        bookingId: booking.id,
        provider: 'manual', // Required string field
        txnRef: `payment_${paymentId}`, // Required unique string field
        amount: Number(booking.totalAmount),
        currency: booking.currency || 'VND',
        status: PaymentStatus.UNPAID,
        paymentMethod: null,
        metadata: {
          notes: `Payment for booking ${booking.id}`,
          createdFrom: 'booking',
        },
      };

      const payment = await this.prisma.payment.create({
        data: paymentData as any, // Type cast to fix Prisma type issue
      });

      // Convert to entity and return
      return this.toPaymentEntity(payment);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(
          `Failed to create payment from booking: ${error.message}`,
          error.stack,
        );
        throw new DatabaseException(
          `Failed to create payment from booking: ${error.message}`,
        );
      } else {
        this.logger.error(
          'Failed to create payment from booking: Unknown error',
        );
        throw new DatabaseException(
          'Failed to create payment from booking: Unknown error',
        );
      }
    }
  }

  async verifyPayment(provider: string, data: any): Promise<PaymentEntity> {
    try {
      const strategy = this.strategies.get(provider.toUpperCase());
      if (!strategy) {
        throw new BadRequestException(
          `Payment provider ${provider} not supported`,
        );
      }

      const verification = await strategy.verifyPayment(data);

      const payment = await this.prisma.payment.findFirst({
        where: {
          txnRef: verification.transactionId,
        },
      });

      if (!payment) {
        throw new NotFoundException('Payment not found');
      }

      // Update payment status and metadata
      const updatedPayment = await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: verification.status,
          paidAt: verification.success ? new Date() : null,
          metadata: {
            ...(payment.metadata as any),
            verificationData: verification.data,
            verifiedAt: new Date(),
          },
        },
      });

      // Update booking status after payment confirmation/failure
      if (verification.success && verification.status === 'PAID') {
        await this.prisma.booking.update({
          where: { id: payment.bookingId },
          data: {
            paymentStatus: PaymentStatus.PAID,
            status: 'CONFIRMED',
          },
        });
      } else if (!verification.success || verification.status === 'FAILED') {
        await this.prisma.booking.update({
          where: { id: payment.bookingId },
          data: {
            paymentStatus: PaymentStatus.UNPAID,
            status: 'PENDING',
          },
        });
      }

      this.logger.log(
        `Verified payment ${payment.id} with status ${verification.status}`,
      );
      return this.toPaymentEntity(updatedPayment);
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(
          `Failed to verify payment: ${error.message}`,
          error.stack,
        );
      } else {
        this.logger.error('Failed to verify payment: Unknown error');
      }
      throw error;
    }
  }

  async findAll(options: PaginationOptionsDto & PaymentFilterDto) {
    const { page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    const where = {
      createdAt: {
        gte: options.dateFrom ? new Date(options.dateFrom) : undefined,
        lte: options.dateTo ? new Date(options.dateTo) : undefined,
      },
      status: options.status,
    };

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        skip,
        take: limit,
        where,
      }),
      this.prisma.payment.count({ where }),
    ]);

    return {
      data: payments.map((payment) => this.toPaymentEntity(payment)),
      metadata: this.createPaginationMeta(total, page, limit),
    };
  }

  async findOne(id: string): Promise<PaymentEntity> {
    try {
      const payment = await this.prisma.payment.findUnique({
        where: { id },
      });

      if (!payment) {
        throw new NotFoundException(`Payment with ID ${id} not found`);
      }

      return this.toPaymentEntity(payment);
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(
          `Failed to find payment: ${error.message}`,
          error.stack,
        );
      } else {
        this.logger.error('Failed to find payment: Unknown error');
      }
      throw error;
    }
  }

  async getPaymentStats(): Promise<PaymentStatsDto> {
    const [totalAmount, totalCount, pendingCount, paidCount, recentPayments] =
      await Promise.all([
        this.prisma.payment.aggregate({
          _sum: {
            amount: true,
          },
        }),
        this.prisma.payment.count(),
        this.prisma.payment.count({
          where: { status: PaymentStatus.UNPAID },
        }),
        this.prisma.payment.count({
          where: { status: PaymentStatus.PAID },
        }),
        this.prisma.payment.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
        }),
      ]);

    return {
      totalAmount: Number(totalAmount._sum.amount) || 0,
      totalCount,
      pendingCount,
      paidCount,
      recentPayments: recentPayments.map((payment) =>
        this.toPaymentEntity(payment),
      ),
    };
  }

  async findByBookingId(bookingId: string): Promise<PaymentEntity[]> {
    const payments = await this.prisma.payment.findMany({
      where: { bookingId },
      orderBy: { createdAt: 'desc' },
    });

    return payments.map((payment) => this.toPaymentEntity(payment));
  }

  async findById(paymentId: string): Promise<PaymentEntity> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return this.toPaymentEntity(payment);
  }

  async findByUserId(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    data: PaymentEntity[];
    total: number;
    page: number;
    limit: number;
  }> {
    const offset = (page - 1) * limit;

    // We need to find payments through bookings since Payment doesn't have userId
    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where: {
          bookingId: {
            in: (
              await this.prisma.booking.findMany({
                where: { userId: userId },
                select: { id: true },
              })
            ).map((b) => b.id),
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      this.prisma.payment.count({
        where: {
          bookingId: {
            in: (
              await this.prisma.booking.findMany({
                where: { userId: userId },
                select: { id: true },
              })
            ).map((b) => b.id),
          },
        },
      }),
    ]);

    return {
      data: payments.map((payment) => this.toPaymentEntity(payment)),
      total,
      page,
      limit,
    };
  }

  getPaymentMethods(): Array<{
    provider: string;
    name: string;
    description: string;
  }> {
    return [
      {
        provider: 'VNPAY',
        name: 'VNPay',
        description: 'Thanh toán qua VNPay - Hỗ trợ thẻ ATM, Internet Banking',
      },
      {
        provider: 'MOMO',
        name: 'MoMo',
        description: 'Thanh toán qua ví điện tử MoMo',
      },
      {
        provider: 'STRIPE',
        name: 'Stripe',
        description: 'Thanh toán qua thẻ tín dụng quốc tế',
      },
    ];
  }

  // Alias methods for backward compatibility
  async getPaymentsByUser(userId: string): Promise<PaymentEntity[]> {
    const result = await this.findByUserId(userId);
    return result.data;
  }

  async getPaymentById(paymentId: string): Promise<PaymentEntity> {
    return this.findById(paymentId);
  }

  async updatePaymentStatus(
    id: string,
    updateData: { status?: string; metadata?: any },
    userId?: string,
  ): Promise<PaymentEntity> {
    try {
      this.logger.log(
        `Attempting to update payment ${id} by userId: ${userId || 'system'}`,
      );

      // Get payment first
      const payment = await this.prisma.payment.findUnique({
        where: { id },
        include: {
          Booking: { select: { id: true, userId: true, bookingCode: true } },
        },
      });

      if (!payment) {
        throw new NotFoundException(`Payment with ID ${id} not found`);
      }

      // Check authorization if userId provided
      if (userId && payment.Booking.userId !== userId) {
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          select: {
            roleId: true,
            email: true,
            Role: { select: { name: true } },
          },
        });

        if (!user) {
          throw new ConflictException('Người dùng không tồn tại');
        }

        const roleName = user.Role?.name?.toUpperCase();
        if (roleName !== 'ADMIN' && roleName !== 'STAFF') {
          throw new ConflictException(
            'Bạn không có quyền cập nhật thanh toán này',
          );
        }
      }

      // Update payment
      const updatedPayment = await this.prisma.payment.update({
        where: { id },
        data: {
          ...(updateData.status && {
            status: updateData.status as PaymentStatus,
          }),
          ...(updateData.metadata && {
            metadata: {
              ...(payment.metadata as any),
              ...updateData.metadata,
            },
          }),
          updatedAt: new Date(),
        },
      });

      // Update booking if payment status changed
      if (updateData.status) {
        await this.prisma.booking.update({
          where: { id: payment.bookingId },
          data: {
            paymentStatus: updateData.status as PaymentStatus,
            status: updateData.status === 'PAID' ? 'CONFIRMED' : 'PENDING',
          },
        });
      }

      this.logger.log(`Payment ${id} updated successfully`);
      return this.toPaymentEntity(updatedPayment);
    } catch (error: unknown) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to update payment: ${errorMessage}`);
      throw new DatabaseException(
        `Lỗi khi cập nhật thanh toán: ${errorMessage}`,
      );
    }
  }

  async deletePayment(
    id: string,
    userId?: string,
  ): Promise<{ success: boolean; message: string; id: string }> {
    try {
      this.logger.log(
        `Attempting to delete payment with ID: ${id} by userId: ${userId || 'system'}`,
      );

      // First check if we can find a payment with the exact ID
      let payment = await this.prisma.payment.findUnique({
        where: { id },
        include: {
          Booking: { select: { id: true, userId: true, bookingCode: true } },
        },
      });

      // If not found by ID, try finding by bookingId (for compatibility with frontend)
      if (!payment) {
        this.logger.log(
          `Payment not found with ID ${id}, trying to find by bookingId`,
        );

        // Check for "payment-" prefix (frontend convention)
        const bookingId = id.startsWith('payment-')
          ? id.replace('payment-', '')
          : id;
        this.logger.log(`Checking for payments with bookingId: ${bookingId}`);

        const paymentsByBooking = await this.prisma.payment.findMany({
          where: { bookingId },
          include: {
            Booking: { select: { id: true, userId: true, bookingCode: true } },
          },
          orderBy: { createdAt: 'desc' },
        });

        if (paymentsByBooking.length > 0) {
          payment = paymentsByBooking[0]; // Get the most recent payment for this booking
          this.logger.log(
            `Found payment ${payment.id} by bookingId ${bookingId}`,
          );
        } else {
          // Try direct txnRef lookup as a last resort
          this.logger.log(
            `No payments found by bookingId ${bookingId}, trying txnRef lookup`,
          );
          const paymentByTxn = await this.prisma.payment.findFirst({
            where: { txnRef: id },
            include: {
              Booking: {
                select: { id: true, userId: true, bookingCode: true },
              },
            },
          });

          if (paymentByTxn) {
            payment = paymentByTxn;
            this.logger.log(`Found payment ${payment.id} by txnRef ${id}`);
          }
        }
      }

      if (!payment) {
        // Check if the booking exists but has no payments
        const bookingId = id.startsWith('payment-')
          ? id.replace('payment-', '')
          : id;

        const booking = await this.prisma.booking.findUnique({
          where: { id: bookingId },
          select: { id: true, bookingCode: true, paymentStatus: true },
        });

        if (booking) {
          this.logger.warn(
            `Delete payment failed: Booking ${booking.bookingCode} exists but has no payment records`,
          );
          throw new NotFoundException(
            `Booking ${booking.bookingCode} không có bản ghi thanh toán nào để xóa. ` +
              `Trạng thái thanh toán hiện tại: ${booking.paymentStatus}`,
          );
        } else {
          this.logger.warn(
            `Delete payment failed: Neither payment nor booking found with ID ${id}`,
          );
          throw new NotFoundException(
            `Không tìm thấy thanh toán hoặc booking với ID ${id}`,
          );
        }
      }

      // Check if user is authorized to delete this payment
      if (userId && payment.Booking.userId !== userId) {
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          select: {
            roleId: true,
            email: true,
            Role: { select: { name: true } },
          },
        });

        // Check user roles - allowing only admin and staff to delete payments
        if (!user) {
          this.logger.warn(`Delete payment failed: User ${userId} not found`);
          throw new ConflictException('Người dùng không tồn tại');
        }

        const roleName = user.Role?.name?.toUpperCase();
        this.logger.log(
          `Debug: User ${userId} has role name: "${roleName}" (raw: "${user.Role?.name}")`,
        );

        if (roleName !== 'ADMIN' && roleName !== 'STAFF') {
          this.logger.warn(
            `Delete payment authorization failed for user ${userId} (${user.email}) with role ${roleName}`,
          );
          throw new ConflictException('Bạn không có quyền xóa thanh toán này');
        }

        this.logger.log(
          `User ${userId} (${user.email}) with role ${roleName} authorized to delete payment ${id}`,
        );
      }

      // Additional logging before deletion
      this.logger.log(
        `Deleting payment ${id} for booking ${payment.Booking.bookingCode}`,
      );

      try {
        // Delete the payment and return its data
        await this.prisma.payment.delete({
          where: { id: payment.id }, // Use payment.id to ensure we're using the correct one
        });

        this.logger.log(`Payment ${payment.id} successfully deleted`);
        return {
          success: true,
          message: `Đã xóa thanh toán ${payment.id} thành công`,
          id: payment.id,
        };
      } catch (prismaError) {
        const errorMessage =
          prismaError instanceof Error
            ? prismaError.message
            : 'Unknown database error';
        this.logger.error(
          `Database error deleting payment ${payment.id}: ${errorMessage}`,
        );
        throw new DatabaseException(
          `Không thể xóa thanh toán: ${errorMessage}`,
        );
      }
    } catch (error: unknown) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `Failed to delete payment: ${errorMessage}`,
        errorStack,
      );
      throw new DatabaseException(`Lỗi khi xóa thanh toán: ${errorMessage}`);
    }
  }

  // Helper method to create pagination metadata
  private createPaginationMeta(total: number, page: number, limit: number) {
    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Helper method to safely convert Prisma Payment to PaymentEntity
  private toPaymentEntity(payment: any): PaymentEntity {
    if (!payment) {
      throw new Error('Payment data is missing');
    }

    return new PaymentEntity({
      id: payment.id,
      bookingId: payment.bookingId,
      provider: payment.provider ?? undefined, // Convert null to undefined
      txnRef: payment.txnRef ?? undefined,
      amount: Number(payment.amount),
      currency: payment.currency,
      status: payment.status,
      paidAt: payment.paidAt ?? undefined,
      paymentMethod: payment.paymentMethod ?? payment.method ?? undefined,
      metadata: payment.metadata,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    });
  }
}
