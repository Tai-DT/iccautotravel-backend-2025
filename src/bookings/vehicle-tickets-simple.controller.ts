import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { BookingsService } from './bookings.service';

interface VehicleTicketFilters {
  page?: number;
  limit?: number;
  status?: string;
  departureDate?: string;
  route?: string;
}

interface CreateVehicleTicketDto {
  vehicleId: string;
  scheduleId: string;
  departureDate: string;
  departureTime: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  pickupLocation?: string;
  dropoffLocation?: string;
  notes?: string;
}

interface UpdateVehicleTicketDto {
  status?: string;
  notes?: string;
}

@ApiTags('Vehicle Tickets')
@Controller('vehicle-tickets')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VehicleTicketsSimpleController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get()
  @Roles('ADMIN', 'STAFF', 'VEHICLE_TICKET_MANAGER')
  @ApiOperation({ summary: 'Get vehicle tickets list' })
  @ApiResponse({
    status: 200,
    description: 'Vehicle tickets retrieved successfully',
  })
  async getVehicleTickets(@Query() filters: VehicleTicketFilters) {
    // Simple implementation - get all bookings and filter for vehicle types
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, 50); // Max 50 records

    // This is a simplified version - in production you'd have proper filtering
    const result = await this.bookingsService.findAll({
      page,
      limit,
      status: filters.status,
    });

    return {
      data: result.data,
      pagination: { page: page, limit: limit, total: result.meta.total },
      message: 'Vehicle tickets retrieved successfully',
    };
  }

  @Get(':id')
  @Roles('ADMIN', 'STAFF', 'VEHICLE_TICKET_MANAGER')
  @ApiOperation({ summary: 'Get vehicle ticket details' })
  async getVehicleTicketById(@Param('id') id: string) {
    const ticket = await this.bookingsService.findOne(id);
    return {
      data: ticket,
      message: 'Vehicle ticket retrieved successfully',
    };
  }

  @Post()
  @Roles('ADMIN', 'STAFF', 'VEHICLE_TICKET_MANAGER')
  @ApiOperation({ summary: 'Create new vehicle ticket' })
  @ApiResponse({
    status: 201,
    description: 'Vehicle ticket created successfully',
  })
  @HttpCode(HttpStatus.CREATED)
  async createVehicleTicket(@Body() createDto: CreateVehicleTicketDto) {
    // Convert to standard booking DTO format
    const bookingDto = {
      services: [{ serviceId: createDto.vehicleId, quantity: 1 }],
      notes: createDto.notes,
      // Add other required fields based on your booking structure
    };

    const ticket = await this.bookingsService.create(bookingDto as any);
    return {
      data: ticket,
      message: 'Vehicle ticket created successfully',
    };
  }

  @Patch(':id')
  @Roles('ADMIN', 'STAFF', 'VEHICLE_TICKET_MANAGER')
  @ApiOperation({ summary: 'Update vehicle ticket' })
  async updateVehicleTicket(
    @Param('id') id: string,
    @Body() updateDto: UpdateVehicleTicketDto,
  ) {
    const ticket = await this.bookingsService.update(
      id,
      updateDto as any,
      { id: 'system' } as any,
    );
    return {
      data: ticket,
      message: 'Vehicle ticket updated successfully',
    };
  }

  @Delete(':id')
  @Roles('ADMIN', 'STAFF', 'VEHICLE_TICKET_MANAGER')
  @ApiOperation({ summary: 'Cancel vehicle ticket' })
  async cancelVehicleTicket(@Param('id') id: string) {
    const ticket = await this.bookingsService.update(
      id,
      {
        status: 'CANCELLED',
      } as any,
      { id: 'system' } as any,
    );
    return {
      data: ticket,
      message: 'Vehicle ticket cancelled successfully',
    };
  }

  @Get(':id/passengers')
  @Roles('ADMIN', 'STAFF', 'VEHICLE_TICKET_MANAGER')
  @ApiOperation({ summary: 'Get vehicle ticket passengers' })
  async getVehicleTicketPassengers(@Param('id') id: string) {
    await this.bookingsService.findOne(id); // Validate ticket exists
    // Extract passenger info from ticket data
    const passengers: any[] = []; // TODO: Extract from actual ticket data structure

    return {
      data: passengers,
      message: 'Passengers retrieved successfully',
    };
  }

  @Patch(':id/status')
  @Roles('ADMIN', 'VEHICLE_TICKET_MANAGER')
  @ApiOperation({ summary: 'Update ticket status' })
  async updateTicketStatus(
    @Param('id') id: string,
    @Body() statusDto: { status: string; notes?: string },
  ) {
    const ticket = await this.bookingsService.update(
      id,
      {
        status: statusDto.status,
        notes: statusDto.notes,
      } as any,
      { id: 'system' } as any,
    );

    return {
      data: ticket,
      message: 'Ticket status updated successfully',
    };
  }

  @Post(':id/refund')
  @Roles('ADMIN', 'VEHICLE_TICKET_MANAGER')
  @ApiOperation({ summary: 'Process refund for vehicle ticket' })
  async processRefund(
    @Param('id') id: string,
    @Body() refundDto: { amount?: number; reason: string },
  ) {
    // This would integrate with payment service in real implementation
    const ticket = await this.bookingsService.update(
      id,
      {
        status: 'REFUNDED',
        notes: `Refund processed: ${refundDto.reason}`,
      } as any,
      { id: 'system' } as any,
    );

    return {
      data: ticket,
      message: 'Refund processed successfully',
    };
  }

  @Get('/analytics/overview')
  @Roles('ADMIN', 'VEHICLE_TICKET_MANAGER')
  @ApiOperation({ summary: 'Get vehicle ticket analytics overview' })
  getAnalyticsOverview(
    @Query() filters: { startDate?: string; endDate?: string },
  ) {
    // Simplified analytics - in real implementation this would be more comprehensive
    const analytics = {
      totalTickets: 0,
      confirmedTickets: 0,
      cancelledTickets: 0,
      refundedTickets: 0,
      revenue: 0,
      period:
        filters.startDate && filters.endDate
          ? `${filters.startDate} to ${filters.endDate}`
          : 'All time',
      // TODO: Implement actual analytics logic
    };

    return {
      data: analytics,
      message: 'Analytics retrieved successfully',
    };
  }

  @Post('/export')
  @Roles('ADMIN', 'VEHICLE_TICKET_MANAGER')
  @ApiOperation({ summary: 'Export vehicle ticket data' })
  exportTicketData(
    @Body()
    exportDto: {
      format: 'csv' | 'excel';
      startDate: string;
      endDate: string;
      filters?: any;
    },
  ) {
    // Check time restrictions (only outside business hours)
    const currentHour = new Date().getHours();
    if (currentHour >= 8 && currentHour < 18) {
      throw new Error(
        'Export is only allowed outside business hours (6 PM - 8 AM)',
      );
    }

    // This would generate actual export file in real implementation
    const exportData = {
      exportId: `export_${Date.now()}`,
      format: exportDto.format,
      startDate: exportDto.startDate,
      endDate: exportDto.endDate,
      status: 'processing',
      message: 'Export request submitted successfully',
    };

    return {
      data: exportData,
      message: 'Export request submitted successfully',
    };
  }
}
