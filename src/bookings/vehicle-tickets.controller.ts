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
  UseInterceptors,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EnhancedPermissionsGuard } from '../auth/guards/enhanced-permissions-simple.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PERMISSIONS } from '../common/constants/permissions';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { ThrottlerGuard } from '@nestjs/throttler';

@ApiTags('Vehicle Tickets Management')
@Controller('vehicle-tickets')
@UseGuards(JwtAuthGuard, EnhancedPermissionsGuard, ThrottlerGuard)
@ApiBearerAuth()
export class VehicleTicketsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get()
  @Permissions(PERMISSIONS.VEHICLE_TICKETS.READ_ALL_TICKETS)
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300) // 5 minutes cache
  @ApiOperation({
    summary: 'Get all vehicle tickets',
    description:
      'Retrieve all vehicle tickets with filtering options. Restricted to vehicle tickets only.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    type: String,
    description: 'Filter by booking status',
  })
  @ApiQuery({
    name: 'vehicleType',
    required: false,
    type: String,
    description: 'Filter by vehicle type',
  })
  @ApiQuery({
    name: 'route',
    required: false,
    type: String,
    description: 'Filter by route',
  })
  @ApiQuery({
    name: 'departureDate',
    required: false,
    type: String,
    description: 'Filter by departure date',
  })
  @ApiResponse({ status: 200, description: 'List of vehicle tickets' })
  async getAllVehicleTickets(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('vehicleType') vehicleType?: string,
    @Query('route') route?: string,
    @Query('departureDate') departureDate?: string,
  ) {
    const pageNum = parseInt(page || '1');
    const limitNum = parseInt(limit || '10');

    // Filter for vehicle tickets only (BUS, VEHICLE, TRANSFER services)
    return this.bookingsService.findVehicleTickets({
      page: pageNum,
      limit: limitNum,
      status,
      vehicleType,
      route,
      departureDate,
    });
  }

  @Get(':id')
  @Permissions(PERMISSIONS.VEHICLE_TICKETS.READ_TICKET_DETAILS)
  @ApiOperation({ summary: 'Get vehicle ticket details' })
  @ApiParam({ name: 'id', description: 'Vehicle ticket ID' })
  @ApiResponse({ status: 200, description: 'Vehicle ticket details' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  async getVehicleTicket(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    return this.bookingsService.findVehicleTicket(id, user);
  }

  @Post()
  @Permissions(PERMISSIONS.VEHICLE_TICKETS.CREATE_TICKET)
  @ApiOperation({
    summary: 'Create vehicle ticket',
    description: 'Create a new vehicle ticket booking',
  })
  @ApiResponse({
    status: 201,
    description: 'Vehicle ticket created successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async createVehicleTicket(
    @Body() createTicketDto: CreateBookingDto,
    @CurrentUser() user: any,
  ) {
    // Validate that this is a vehicle-related service
    await this.bookingsService.validateVehicleServices(
      createTicketDto.serviceIds,
    );

    return this.bookingsService.createVehicleTicket(createTicketDto, user);
  }

  @Patch(':id/status')
  @Permissions(PERMISSIONS.VEHICLE_TICKETS.UPDATE_TICKET_STATUS)
  @ApiOperation({ summary: 'Update vehicle ticket status' })
  @ApiParam({ name: 'id', description: 'Vehicle ticket ID' })
  @ApiResponse({ status: 200, description: 'Ticket status updated' })
  async updateTicketStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { status: string; reason?: string },
    @CurrentUser() user: any,
  ) {
    return this.bookingsService.updateVehicleTicketStatus(
      id,
      body.status as any,
      user,
    );
  }

  @Patch(':id')
  @Permissions(PERMISSIONS.VEHICLE_TICKETS.UPDATE_TICKET_STATUS)
  @ApiOperation({ summary: 'Update vehicle ticket details' })
  @ApiParam({ name: 'id', description: 'Vehicle ticket ID' })
  @ApiResponse({ status: 200, description: 'Ticket updated successfully' })
  async updateVehicleTicket(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTicketDto: UpdateBookingDto & { version: number },
    @CurrentUser() user: any,
  ) {
    return this.bookingsService.updateVehicleTicket(id, updateTicketDto, user);
  }

  @Delete(':id')
  @Permissions(PERMISSIONS.VEHICLE_TICKETS.CANCEL_TICKET)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cancel vehicle ticket' })
  @ApiParam({ name: 'id', description: 'Vehicle ticket ID' })
  @ApiResponse({ status: 204, description: 'Ticket cancelled successfully' })
  @ApiResponse({
    status: 403,
    description: 'Not authorized to cancel this ticket',
  })
  async cancelVehicleTicket(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    await this.bookingsService.cancelVehicleTicket(id, user);
    return { status: 'CANCELLED' };
  }

  @Get(':id/passengers')
  @Permissions(PERMISSIONS.VEHICLE_TICKETS.VIEW_PASSENGER_LIST)
  @ApiOperation({ summary: 'Get passenger list for vehicle ticket' })
  @ApiParam({ name: 'id', description: 'Vehicle ticket ID' })
  @ApiResponse({ status: 200, description: 'Passenger list' })
  async getPassengerList(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    return this.bookingsService.getVehicleTicketPassengers(id, user);
  }

  @Patch(':id/seats')
  @Permissions(PERMISSIONS.VEHICLE_TICKETS.MANAGE_SEAT_ASSIGNMENT)
  @ApiOperation({ summary: 'Manage seat assignments for vehicle ticket' })
  @ApiParam({ name: 'id', description: 'Vehicle ticket ID' })
  @ApiResponse({ status: 200, description: 'Seat assignments updated' })
  async manageSeatAssignment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body()
    seatData: { passengers: Array<{ name: string; seatNumber: string }> },
    @CurrentUser() user: any,
  ) {
    return this.bookingsService.updateSeatAssignments(
      id,
      seatData.passengers,
      user,
    );
  }

  @Get('analytics/overview')
  @Permissions(PERMISSIONS.VEHICLE_TICKETS.VIEW_TICKET_ANALYTICS)
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(600) // 10 minutes cache
  @ApiOperation({
    summary: 'Get vehicle ticket analytics overview',
    description: 'Get analytics data limited to vehicle tickets only',
  })
  @ApiQuery({ name: 'period', required: false, enum: ['7d', '30d', '90d'] })
  @ApiResponse({ status: 200, description: 'Vehicle ticket analytics' })
  async getVehicleTicketAnalytics(
    @CurrentUser() user: any,
    @Query('period') period?: string,
  ) {
    return this.bookingsService.getVehicleTicketAnalytics(period || '30d');
  }

  @Get('schedule/:vehicleId')
  @Permissions(PERMISSIONS.VEHICLE_TICKETS.VIEW_VEHICLE_SCHEDULE)
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300)
  @ApiOperation({ summary: 'Get vehicle schedule' })
  @ApiParam({ name: 'vehicleId', description: 'Vehicle service ID' })
  @ApiQuery({
    name: 'date',
    required: false,
    type: String,
    description: 'Specific date (YYYY-MM-DD)',
  })
  @ApiResponse({ status: 200, description: 'Vehicle schedule' })
  async getVehicleSchedule(
    @Param('vehicleId') vehicleId: string,
    @CurrentUser() user: any,
    @Query('date') date?: string,
  ) {
    return this.bookingsService.getVehicleSchedule(vehicleId, date);
  }

  @Get('routes/popular')
  @Permissions(PERMISSIONS.VEHICLE_TICKETS.VIEW_ROUTES)
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(1800) // 30 minutes cache
  @ApiOperation({ summary: 'Get popular vehicle routes' })
  @ApiResponse({ status: 200, description: 'Popular routes list' })
  async getPopularRoutes() {
    return this.bookingsService.getPopularVehicleRoutes();
  }

  @Post(':id/refund')
  @Permissions(PERMISSIONS.VEHICLE_TICKETS.PROCESS_REFUNDS)
  @ApiOperation({ summary: 'Process ticket refund' })
  @ApiParam({ name: 'id', description: 'Vehicle ticket ID' })
  @ApiResponse({ status: 200, description: 'Refund processed' })
  async processRefund(
    @Param('id', ParseUUIDPipe) id: string,
    @Body()
    refundData: {
      refundAmount: number;
      reason: string;
      refundMethod: string;
    },
    @CurrentUser() user: any,
  ) {
    return this.bookingsService.processVehicleTicketRefund(
      id,
      refundData,
      user,
    );
  }

  @Post('export')
  @Permissions(PERMISSIONS.VEHICLE_TICKETS.EXPORT_TICKET_DATA)
  @ApiOperation({ summary: 'Export vehicle ticket data' })
  @ApiResponse({ status: 200, description: 'Export completed' })
  async exportTicketData(
    @Body()
    exportParams: {
      startDate: string;
      endDate: string;
      format: 'excel' | 'csv';
      filters?: any;
    },
    @CurrentUser() user: any,
  ) {
    return this.bookingsService.exportVehicleTicketData(exportParams, user);
  }

  @Get(':id/customer-requests')
  @Permissions(PERMISSIONS.VEHICLE_TICKETS.HANDLE_CUSTOMER_REQUESTS)
  @ApiOperation({ summary: 'Get customer requests for ticket' })
  @ApiParam({ name: 'id', description: 'Vehicle ticket ID' })
  @ApiResponse({ status: 200, description: 'Customer requests list' })
  async getCustomerRequests(@Param('id', ParseUUIDPipe) id: string) {
    return this.bookingsService.getVehicleTicketCustomerRequests(id);
  }

  @Post(':id/customer-requests/:requestId/respond')
  @Permissions(PERMISSIONS.VEHICLE_TICKETS.HANDLE_CUSTOMER_REQUESTS)
  @ApiOperation({ summary: 'Respond to customer request' })
  @ApiParam({ name: 'id', description: 'Vehicle ticket ID' })
  @ApiParam({ name: 'requestId', description: 'Customer request ID' })
  @ApiResponse({ status: 200, description: 'Response sent' })
  async respondToCustomerRequest(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('requestId', ParseUUIDPipe) requestId: string,
    @Body() response: { message: string; action?: string },
    @CurrentUser() user: any,
  ) {
    return this.bookingsService.respondToVehicleTicketRequest(
      id,
      { ...response, requestId },
      user,
    );
  }
}
