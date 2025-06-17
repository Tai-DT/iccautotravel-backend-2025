import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { BookingStatus } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ROLE_NAMES } from '../common/constants/roles';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuditLogService } from '../audit-log/audit-log.service';
// import { Throttle } from '@nestjs/throttler'; // Tạm thời vô hiệu hóa do lỗi kiểu
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Bookings')
@Controller('bookings')
export class BookingsController {
  constructor(
    private readonly bookingsService: BookingsService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE_NAMES.ADMIN, ROLE_NAMES.STAFF)
  @ApiOperation({ summary: 'Get all bookings' })
  @ApiResponse({ status: 200, description: 'List of bookings' })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('userId') userId?: string,
  ) {
    const pageNum = parseInt(page || '1');
    const limitNum = parseInt(limit || '10');
    return this.bookingsService.findAll({
      page: pageNum,
      limit: limitNum,
      status,
      userId,
    });
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE_NAMES.ADMIN, ROLE_NAMES.STAFF, ROLE_NAMES.CUSTOMER)
  @ApiOperation({ summary: 'Get booking by ID' })
  @ApiResponse({ status: 200, description: 'Booking details' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    return this.bookingsService.findOne(id, user);
  }

  @Post()
  async create(@Body() createBookingDto: CreateBookingDto) {
    return this.bookingsService.create(createBookingDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE_NAMES.CUSTOMER, ROLE_NAMES.ADMIN, ROLE_NAMES.STAFF)
  // @Throttle({ limit: 5, ttl: 300 }) // Tạm thời vô hiệu hóa do lỗi kiểu
  @ApiOperation({ summary: 'Update a booking' })
  @ApiResponse({ status: 200, description: 'Booking updated', type: Object })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 409, description: 'Conflict (overlap or version)' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateBookingDto: UpdateBookingDto & { version: number },
    @CurrentUser() user: any,
  ) {
    // Timezone validation: ensure UTC
    if (updateBookingDto.startDate)
      updateBookingDto.startDate = new Date(
        updateBookingDto.startDate,
      ).toISOString();
    if (updateBookingDto.endDate)
      updateBookingDto.endDate = new Date(
        updateBookingDto.endDate,
      ).toISOString();
    // Pass version to service for optimistic locking
    const updated = await this.bookingsService.update(
      id,
      updateBookingDto,
      user,
    );
    await this.auditLogService.log(user.id, 'BOOKING_UPDATE', {
      bookingId: id,
      update: updateBookingDto,
    });
    return updated;
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE_NAMES.CUSTOMER, ROLE_NAMES.ADMIN, ROLE_NAMES.STAFF)
  @ApiOperation({ summary: 'Cancel or delete a booking' })
  @ApiResponse({ status: 204, description: 'Booking cancelled or deleted' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async deleteBooking(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
    @Query('force') force?: string,
  ) {
    // If force=true and user is admin, permanently delete the booking
    const roleStr =
      typeof user.role === 'string'
        ? user.role
        : (user.role as any)?.name || '';
    if (force === 'true' && roleStr === 'Admin') {
      const deletedBooking = await this.bookingsService.remove(id, user);
      await this.auditLogService.log(user.id, 'BOOKING_DELETE', {
        bookingId: id,
        deletedBooking,
      });
      return { status: 'DELETED', message: 'Booking permanently deleted' };
    } else {
      // Otherwise, just cancel the booking
      await this.bookingsService.cancel(id, user);
      await this.auditLogService.log(user.id, 'BOOKING_CANCEL', {
        bookingId: id,
      });
      return { status: 'CANCELLED', message: 'Booking cancelled' };
    }
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    return this.bookingsService.updateStatus(id, body.status as BookingStatus);
  }

  @Post('webhook/payment')
  async handlePaymentWebhook(@Body() data: any) {
    return this.bookingsService.handlePaymentWebhook(data);
  }
}
