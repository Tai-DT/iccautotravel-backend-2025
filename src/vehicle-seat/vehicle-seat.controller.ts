import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { VehicleSeatService } from './vehicle-seat.service';
import { CreateVehicleLayoutDto } from './dto/create-vehicle-layout.dto';
import { BookSeatsDto, VehicleSeatMap } from './dto/seat-booking.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EnhancedPermissionsGuard } from '../auth/guards/enhanced-permissions-simple.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PERMISSIONS } from '../common/constants/permissions';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { ThrottlerGuard } from '@nestjs/throttler';

@ApiTags('Vehicle Seat Management')
@Controller('vehicle-seats')
@UseGuards(JwtAuthGuard, EnhancedPermissionsGuard, ThrottlerGuard)
@ApiBearerAuth()
export class VehicleSeatController {
  constructor(private readonly vehicleSeatService: VehicleSeatService) {}

  @Post('layouts')
  @Permissions(PERMISSIONS.VEHICLE_TICKETS.CREATE_TICKET)
  @ApiOperation({
    summary: 'Tạo layout chỗ ngồi cho xe',
    description:
      'Nhân viên quản lý vé xe có thể tạo layout chỗ ngồi với cấu hình tầng và số lượng ghế',
  })
  @ApiResponse({ status: 201, description: 'Layout đã được tạo thành công' })
  async createVehicleLayout(
    @Body() createLayoutDto: CreateVehicleLayoutDto,
    @CurrentUser() user: any,
  ) {
    return this.vehicleSeatService.createVehicleLayout(createLayoutDto);
  }

  @Get('layouts/:layoutId')
  @Permissions(PERMISSIONS.VEHICLE_TICKETS.READ_TICKET_DETAILS)
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300)
  @ApiOperation({ summary: 'Lấy thông tin layout chỗ ngồi' })
  @ApiParam({ name: 'layoutId', description: 'ID của layout' })
  @ApiResponse({ status: 200, description: 'Thông tin layout' })
  async getVehicleLayout(
    @Param('layoutId') layoutId: string,
    @CurrentUser() user: any,
  ) {
    return this.vehicleSeatService.getVehicleLayout(layoutId);
  }

  @Get('map/:vehicleId')
  @Permissions(PERMISSIONS.VEHICLE_TICKETS.READ_ALL_TICKETS)
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(60) // Cache ngắn cho real-time seat availability
  @ApiOperation({
    summary: 'Lấy sơ đồ chỗ ngồi thời gian thực',
    description:
      'Hiển thị trạng thái các chỗ ngồi: Available, Booked, Reserved',
  })
  @ApiParam({ name: 'vehicleId', description: 'ID của xe' })
  @ApiQuery({ name: 'scheduleId', description: 'ID chuyến xe' })
  @ApiQuery({
    name: 'departureDate',
    description: 'Ngày khởi hành (YYYY-MM-DD)',
  })
  @ApiResponse({
    status: 200,
    description: 'Sơ đồ chỗ ngồi',
    type: VehicleSeatMap,
  })
  async getVehicleSeatMap(
    @Param('vehicleId') vehicleId: string,
    @Query('scheduleId') scheduleId: string,
    @Query('departureDate') departureDate: string,
    @CurrentUser() user: any,
  ): Promise<VehicleSeatMap> {
    return this.vehicleSeatService.getVehicleSeatMap(
      vehicleId,
      scheduleId,
      departureDate,
    );
  }

  @Post('book')
  @Permissions(PERMISSIONS.VEHICLE_TICKETS.CREATE_TICKET)
  @ApiOperation({
    summary: 'Đặt chỗ ngồi',
    description:
      'Đặt một hoặc nhiều chỗ ngồi cho khách hàng. Ghế sẽ được reserve trong 15 phút.',
  })
  @ApiResponse({ status: 201, description: 'Đặt chỗ thành công' })
  @ApiResponse({ status: 409, description: 'Chỗ ngồi đã được đặt' })
  async bookSeats(
    @Body() bookSeatsDto: BookSeatsDto,
    @CurrentUser() user: any,
  ) {
    return this.vehicleSeatService.bookSeats(bookSeatsDto);
  }

  @Patch('booking/:bookingId/confirm')
  @Permissions(PERMISSIONS.VEHICLE_TICKETS.CONFIRM_TICKET)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Xác nhận đặt chỗ',
    description: 'Xác nhận đặt chỗ sau khi thanh toán thành công',
  })
  @ApiParam({ name: 'bookingId', description: 'ID booking' })
  @ApiResponse({ status: 200, description: 'Xác nhận thành công' })
  async confirmBooking(
    @Param('bookingId') bookingId: string,
    @CurrentUser() user: any,
  ) {
    await this.vehicleSeatService.confirmSeatBooking(bookingId);
    return { success: true, message: 'Booking confirmed' };
  }

  @Patch('booking/:bookingId/cancel')
  @Permissions(PERMISSIONS.VEHICLE_TICKETS.CANCEL_TICKET)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Hủy đặt chỗ',
    description: 'Hủy đặt chỗ và giải phóng ghế',
  })
  @ApiParam({ name: 'bookingId', description: 'ID booking' })
  @ApiResponse({ status: 200, description: 'Hủy thành công' })
  async cancelBooking(
    @Param('bookingId') bookingId: string,
    @CurrentUser() user: any,
  ) {
    await this.vehicleSeatService.cancelSeatBooking(bookingId);
    return { success: true, message: 'Booking cancelled' };
  }

  @Post('cleanup-expired')
  @Permissions(PERMISSIONS.VEHICLE_TICKETS.UPDATE_TICKET_STATUS)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Dọn dẹp reservation hết hạn',
    description: 'Hủy các reservation quá 15 phút chưa thanh toán',
  })
  @ApiResponse({ status: 200, description: 'Cleanup completed' })
  async cleanupExpiredReservations(@CurrentUser() user: any) {
    await this.vehicleSeatService.cleanupExpiredReservations();
    return { success: true, message: 'Expired reservations cleaned up' };
  }

  @Get('statistics/:vehicleId')
  @Permissions(PERMISSIONS.VEHICLE_TICKETS.VIEW_TICKET_ANALYTICS)
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(1800) // 30 minutes cache
  @ApiOperation({
    summary: 'Thống kê chỗ ngồi',
    description: 'Thống kê tỷ lệ lấp đầy, loại ghế được ưa chuộng',
  })
  @ApiParam({ name: 'vehicleId', description: 'ID của xe' })
  @ApiQuery({ name: 'startDate', description: 'Ngày bắt đầu (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', description: 'Ngày kết thúc (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Thống kê chỗ ngồi' })
  async getSeatStatistics(
    @Param('vehicleId') vehicleId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @CurrentUser() user: any,
  ) {
    return this.vehicleSeatService.getSeatStatistics(
      vehicleId,
      startDate,
      endDate,
    );
  }

  @Get('templates/standard-layouts')
  @Permissions(PERMISSIONS.VEHICLE_TICKETS.READ_ALL_TICKETS)
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(3600) // 1 hour cache
  @ApiOperation({
    summary: 'Lấy template layout chuẩn',
    description:
      'Các mẫu layout phổ biến: Limousine 34 chỗ, Giường nằm 40 chỗ, Xe khách 45 chỗ',
  })
  @ApiResponse({ status: 200, description: 'Danh sách template layouts' })
  async getStandardLayouts(@CurrentUser() user: any) {
    return this.vehicleSeatService.createStandardLayouts();
  }

  @Get('availability/check')
  @Permissions(PERMISSIONS.VEHICLE_TICKETS.READ_ALL_TICKETS)
  @ApiOperation({
    summary: 'Kiểm tra tình trạng chỗ ngồi',
    description: 'Kiểm tra nhanh số ghế còn trống cho một chuyến xe',
  })
  @ApiQuery({ name: 'vehicleId', description: 'ID của xe' })
  @ApiQuery({ name: 'scheduleId', description: 'ID chuyến xe' })
  @ApiQuery({ name: 'departureDate', description: 'Ngày khởi hành' })
  @ApiResponse({ status: 200, description: 'Tình trạng ghế trống' })
  async checkSeatAvailability(
    @Query('vehicleId') vehicleId: string,
    @Query('scheduleId') scheduleId: string,
    @Query('departureDate') departureDate: string,
    @CurrentUser() user: any,
  ) {
    const seatMap = await this.vehicleSeatService.getVehicleSeatMap(
      vehicleId,
      scheduleId,
      departureDate,
    );

    return {
      totalSeats: seatMap.totalSeats,
      availableSeats: seatMap.availableSeats,
      bookedSeats: seatMap.bookedSeats,
      occupancyRate: Math.round(
        (seatMap.bookedSeats / seatMap.totalSeats) * 100,
      ),
      availableByFloor: seatMap.floors.map((floor) => ({
        floor: floor.floorNumber,
        available: floor.seats.filter((seat) => seat.status === 'AVAILABLE')
          .length,
        total: floor.seats.length,
      })),
      availableBySeatType: this.groupSeatsByType(seatMap),
    };
  }

  private groupSeatsByType(seatMap: VehicleSeatMap) {
    const seatTypes: Record<string, { available: number; total: number }> = {};

    seatMap.floors.forEach((floor) => {
      floor.seats.forEach((seat) => {
        if (!seatTypes[seat.seatType]) {
          seatTypes[seat.seatType] = { available: 0, total: 0 };
        }
        seatTypes[seat.seatType].total++;
        if (seat.status === 'AVAILABLE') {
          seatTypes[seat.seatType].available++;
        }
      });
    });

    return seatTypes;
  }

  @Post('layouts/:layoutId/duplicate')
  @Permissions(PERMISSIONS.VEHICLE_TICKETS.CREATE_TICKET)
  @ApiOperation({
    summary: 'Sao chép layout',
    description: 'Sao chép layout hiện có cho xe mới',
  })
  @ApiParam({ name: 'layoutId', description: 'ID layout gốc' })
  @ApiResponse({ status: 201, description: 'Layout đã được sao chép' })
  async duplicateLayout(
    @Param('layoutId') layoutId: string,
    @Body()
    {
      newVehicleId,
      newLayoutName,
    }: { newVehicleId: string; newLayoutName: string },
    @CurrentUser() user: any,
  ) {
    const originalLayout =
      await this.vehicleSeatService.getVehicleLayout(layoutId);

    // Create new layout DTO from original
    const newLayoutDto: CreateVehicleLayoutDto = {
      vehicleId: newVehicleId,
      layoutName: newLayoutName,
      vehicleType: originalLayout.vehicleType,
      totalSeats: originalLayout.totalSeats,
      hasMultipleFloors: originalLayout.hasMultipleFloors,
      totalFloors: originalLayout.totalFloors,
      floorLayouts: this.convertSeatsToFloorLayouts(originalLayout.seats),
      isActive: true,
    };

    return this.vehicleSeatService.createVehicleLayout(newLayoutDto);
  }

  private convertSeatsToFloorLayouts(seats: any[]) {
    // Group seats by floor
    const floorMap = new Map();

    seats.forEach((seat) => {
      const floorNum = seat.floor || 1;
      if (!floorMap.has(floorNum)) {
        floorMap.set(floorNum, []);
      }
      floorMap.get(floorNum).push(seat);
    });

    // Convert to FloorLayoutDto format
    const floorLayouts = [];
    for (const [floorNumber, floorSeats] of floorMap.entries()) {
      const maxRow = Math.max(...floorSeats.map((s: any) => s.row));
      const seatsPerRow = floorSeats.filter((s: any) => s.row === 1).length;

      floorLayouts.push({
        floorNumber,
        totalRows: maxRow,
        seatsPerRow,
        seats: floorSeats.map((seat: any) => ({
          seatNumber: seat.seatNumber,
          row: seat.row,
          column: seat.column,
          floor: seat.floor,
          seatType: seat.seatType,
          position: seat.position,
          isAvailable: true,
        })),
      });
    }

    return floorLayouts;
  }
}
