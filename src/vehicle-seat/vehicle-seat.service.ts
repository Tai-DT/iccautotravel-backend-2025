import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateVehicleLayoutDto,
  FloorLayoutDto,
} from './dto/create-vehicle-layout.dto';
import {
  BookSeatsDto,
  VehicleSeatMap,
  FloorSeatMap,
  SeatStatus,
} from './dto/seat-booking.dto';
import {
  VehicleLayoutEntity,
  SeatBookingEntity,
  VehicleScheduleEntity,
} from './entities/vehicle-seat.entity';
import * as crypto from 'crypto';

@Injectable()
export class VehicleSeatService {
  private readonly logger = new Logger(VehicleSeatService.name);

  constructor(private readonly prisma: PrismaService) {}

  // Tạo layout chỗ ngồi cho xe
  async createVehicleLayout(
    createLayoutDto: CreateVehicleLayoutDto,
  ): Promise<VehicleLayoutEntity> {
    try {
      this.logger.log(`Creating vehicle layout: ${createLayoutDto.layoutName}`);

      // Validate seat configuration
      this.validateSeatConfiguration(createLayoutDto);

      const layoutId = crypto.randomUUID();

      // Create vehicle layout
      const layout = await this.prisma.vehicleLayout.create({
        data: {
          id: layoutId,
          vehicleId: createLayoutDto.vehicleId,
          layoutName: createLayoutDto.layoutName,
          vehicleType: createLayoutDto.vehicleType,
          totalSeats: createLayoutDto.totalSeats,
          hasMultipleFloors: createLayoutDto.hasMultipleFloors,
          totalFloors: createLayoutDto.totalFloors,
          description: createLayoutDto.description,
          isActive: createLayoutDto.isActive ?? true,
          updatedAt: new Date(),
        },
      });

      // Create seats for each floor
      const allSeats = [];
      for (const floorLayout of createLayoutDto.floorLayouts) {
        const floorSeats = await this.createSeatsForFloor(
          layoutId,
          floorLayout,
        );
        allSeats.push(...floorSeats);
      }

      this.logger.log(
        `Created ${allSeats.length} seats for layout ${layoutId}`,
      );

      // Return complete layout with seats
      return this.getVehicleLayout(layoutId);
    } catch (error) {
      this.logger.error('Failed to create vehicle layout', error);
      throw error;
    }
  }

  // Tạo chỗ ngồi cho từng tầng
  private async createSeatsForFloor(
    layoutId: string,
    floorLayout: FloorLayoutDto,
  ): Promise<any[]> {
    const seats = [];

    for (const seatConfig of floorLayout.seats) {
      const seatData = {
        id: crypto.randomUUID(),
        vehicleLayoutId: layoutId,
        seatNumber: seatConfig.seatNumber,
        row: seatConfig.row,
        column: seatConfig.column,
        floor: seatConfig.floor || floorLayout.floorNumber,
        seatType: seatConfig.seatType,
        position:
          seatConfig.position ||
          this.determineSeatPosition(
            seatConfig.column,
            floorLayout.seatsPerRow,
          ),
        status: 'ACTIVE',
        price: this.calculateSeatPrice(
          seatConfig.seatType,
          seatConfig.position,
        ),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const seat = await this.prisma.vehicleSeat.create({ data: seatData });
      seats.push(seat);
    }

    return seats;
  }

  // Xác định vị trí ghế (cửa sổ, lối đi, giữa)
  private determineSeatPosition(column: string, seatsPerRow: number): string {
    const columnIndex = column.charCodeAt(0) - 'A'.charCodeAt(0) + 1;

    if (columnIndex === 1 || columnIndex === seatsPerRow) {
      return 'WINDOW';
    } else if (
      seatsPerRow > 3 &&
      (columnIndex === 2 || columnIndex === seatsPerRow - 1)
    ) {
      return 'AISLE';
    } else {
      return 'MIDDLE';
    }
  }

  // Tính giá chỗ ngồi dựa vào loại và vị trí
  private calculateSeatPrice(seatType: string, position?: string): number {
    let basePrice = 100000; // Base price in VND

    // Price by seat type
    switch (seatType) {
      case 'VIP':
        basePrice *= 1.5;
        break;
      case 'SLEEPER':
        basePrice *= 2;
        break;
      case 'STANDARD':
      default:
        break;
    }

    // Price by position
    switch (position) {
      case 'WINDOW':
        basePrice *= 1.1;
        break;
      case 'AISLE':
        basePrice *= 1.05;
        break;
      default:
        break;
    }

    return Math.round(basePrice);
  }

  // Validate cấu hình chỗ ngồi
  private validateSeatConfiguration(config: CreateVehicleLayoutDto): void {
    const totalSeatsFromConfig = config.floorLayouts.reduce(
      (sum, floor) => sum + floor.seats.length,
      0,
    );

    if (totalSeatsFromConfig !== config.totalSeats) {
      throw new BadRequestException(
        `Total seats mismatch: expected ${config.totalSeats}, got ${totalSeatsFromConfig}`,
      );
    }

    // Validate floor numbers
    const floorNumbers = config.floorLayouts.map((f) => f.floorNumber);
    const uniqueFloors = [...new Set(floorNumbers)];

    if (uniqueFloors.length !== config.totalFloors) {
      throw new BadRequestException('Floor configuration mismatch');
    }

    // Validate seat numbers are unique
    const allSeatNumbers = config.floorLayouts.flatMap((floor) =>
      floor.seats.map(
        (seat) => `${seat.floor || floor.floorNumber}-${seat.seatNumber}`,
      ),
    );
    const uniqueSeatNumbers = [...new Set(allSeatNumbers)];

    if (uniqueSeatNumbers.length !== allSeatNumbers.length) {
      throw new BadRequestException('Duplicate seat numbers found');
    }
  }

  // Lấy layout chỗ ngồi của xe
  async getVehicleLayout(layoutId: string): Promise<VehicleLayoutEntity> {
    const layout = await this.prisma.vehicleLayout.findUnique({
      where: { id: layoutId },
      include: {
        VehicleSeat: {
          orderBy: [{ floor: 'asc' }, { row: 'asc' }, { column: 'asc' }],
        },
      },
    });

    if (!layout) {
      throw new NotFoundException('Vehicle layout not found');
    }

    return VehicleLayoutEntity.fromPrisma(layout);
  }

  // Lấy sơ đồ chỗ ngồi với trạng thái thực tế
  async getVehicleSeatMap(
    vehicleId: string,
    scheduleId: string,
    departureDate: string,
  ): Promise<VehicleSeatMap> {
    // Get vehicle layout
    const layout = await this.prisma.vehicleLayout.findFirst({
      where: {
        vehicleId: vehicleId,
        isActive: true,
      },
      include: {
        VehicleSeat: {
          orderBy: [{ floor: 'asc' }, { row: 'asc' }, { column: 'asc' }],
        },
      },
    });

    if (!layout) {
      throw new NotFoundException('Vehicle layout not found');
    }

    // Get seat bookings for this schedule and date
    const seatBookings = await this.prisma.seatBooking.findMany({
      where: {
        scheduleId: scheduleId,
        departureDate: new Date(departureDate),
        status: { in: ['RESERVED', 'CONFIRMED'] },
      },
      include: {
        VehicleSeat: true,
      },
    });

    // Create seat status map
    const bookedSeatIds = new Set(seatBookings.map((b) => b.vehicleSeatId));
    const seatBookingMap = new Map(
      seatBookings.map((b) => [b.vehicleSeatId, b]),
    );

    // Group seats by floor
    const floorMap = new Map<number, any[]>();
    for (const seat of layout.VehicleSeat) {
      const floorNum = seat.floor || 1;
      if (!floorMap.has(floorNum)) {
        floorMap.set(floorNum, []);
      }
      floorMap.get(floorNum)!.push(seat);
    }

    // Build floor seat maps
    const floors: FloorSeatMap[] = [];
    for (const [floorNumber, seats] of floorMap.entries()) {
      const maxRow = Math.max(...seats.map((s) => s.row));
      const seatsPerRow = seats.filter((s) => s.row === 1).length;

      const seatStatuses: SeatStatus[] = seats.map((seat) => {
        const isBooked = bookedSeatIds.has(seat.id);
        const booking = seatBookingMap.get(seat.id);

        return {
          seatNumber: seat.seatNumber,
          floor: seat.floor,
          status: isBooked ? 'BOOKED' : 'AVAILABLE',
          passengerName: booking?.passengerName,
          bookingId: booking?.bookingId,
          reservedUntil: booking?.reservedUntil || undefined,
          seatType: seat.seatType,
          position: seat.position,
          price: Number(seat.price),
        };
      });

      floors.push({
        floorNumber,
        totalRows: maxRow,
        seatsPerRow,
        seats: seatStatuses,
        layout: this.generateSeatLayoutJson(seats, maxRow, seatsPerRow),
      });
    }

    const totalBooked = seatBookings.filter(
      (b) => b.status === 'CONFIRMED',
    ).length;
    const totalAvailable = layout.totalSeats - totalBooked;

    return {
      vehicleId,
      layoutName: layout.layoutName,
      totalSeats: layout.totalSeats,
      availableSeats: totalAvailable,
      bookedSeats: totalBooked,
      hasMultipleFloors: layout.hasMultipleFloors,
      totalFloors: layout.totalFloors,
      floors,
    };
  }

  // Generate layout JSON cho frontend
  private generateSeatLayoutJson(
    seats: any[],
    maxRow: number,
    seatsPerRow: number,
  ): string {
    const layout: string[][] = Array(maxRow)
      .fill(null)
      .map(() => Array(seatsPerRow).fill(''));

    for (const seat of seats) {
      const colIndex = seat.column.charCodeAt(0) - 'A'.charCodeAt(0);
      if (seat.row <= maxRow && colIndex < seatsPerRow) {
        layout[seat.row - 1][colIndex] = seat.seatNumber;
      }
    }

    return JSON.stringify(layout);
  }

  // Đặt chỗ ngồi
  async bookSeats(
    bookingDto: BookSeatsDto,
  ): Promise<{ success: boolean; bookingId: string; seats: any[] }> {
    const bookingId = crypto.randomUUID();

    try {
      // Validate seats are available
      await this.validateSeatAvailability(bookingDto);

      // Create seat bookings
      const seatBookings = [];
      for (const seatSelection of bookingDto.selectedSeats) {
        const seat = await this.findSeatByNumber(
          bookingDto.vehicleId,
          seatSelection.seatNumber,
          seatSelection.floor,
        );

        if (!seat) {
          throw new NotFoundException(
            `Seat ${seatSelection.seatNumber} not found`,
          );
        }

        const booking = await this.prisma.seatBooking.create({
          data: {
            id: crypto.randomUUID(),
            scheduleId: bookingDto.scheduleId,
            vehicleSeatId: seat.id,
            bookingId: bookingId,
            passengerName: seatSelection.passenger.name,
            passengerPhone: seatSelection.passenger.phone,
            passengerIdNumber: seatSelection.passenger.idNumber,
            passengerAge: seatSelection.passenger.age,
            passengerGender: seatSelection.passenger.gender,
            status: 'RESERVED', // Initially reserved, will be confirmed after payment
            departureDate: new Date(bookingDto.departureDate),
            departureTime: bookingDto.departureTime,
            reservedUntil: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes reservation
            specialRequests: seatSelection.passenger.specialRequests,
            updatedAt: new Date(),
          },
        });

        seatBookings.push(booking);
      }

      this.logger.log(
        `Booked ${seatBookings.length} seats for booking ${bookingId}`,
      );

      return {
        success: true,
        bookingId,
        seats: seatBookings.map((b) => ({
          seatNumber: b.vehicleSeatId,
          passengerName: b.passengerName,
          status: b.status,
          reservedUntil: b.reservedUntil,
        })),
      };
    } catch (error) {
      this.logger.error(`Failed to book seats for booking ${bookingId}`, error);
      throw error;
    }
  }

  // Validate tính khả dụng của chỗ ngồi
  private async validateSeatAvailability(
    bookingDto: BookSeatsDto,
  ): Promise<void> {
    for (const seatSelection of bookingDto.selectedSeats) {
      const seat = await this.findSeatByNumber(
        bookingDto.vehicleId,
        seatSelection.seatNumber,
        seatSelection.floor,
      );

      if (!seat) {
        throw new NotFoundException(
          `Seat ${seatSelection.seatNumber} not found`,
        );
      }

      // Check if seat is already booked for this schedule and date
      const existingBooking = await this.prisma.seatBooking.findFirst({
        where: {
          vehicleSeatId: seat.id,
          scheduleId: bookingDto.scheduleId,
          departureDate: new Date(bookingDto.departureDate),
          status: { in: ['RESERVED', 'CONFIRMED'] },
          OR: [
            { reservedUntil: { gt: new Date() } }, // Still reserved
            { status: 'CONFIRMED' }, // Already confirmed
          ],
        },
      });

      if (existingBooking) {
        throw new ConflictException(
          `Seat ${seatSelection.seatNumber} is already booked or reserved`,
        );
      }
    }
  }

  // Tìm chỗ ngồi theo số ghế
  private async findSeatByNumber(
    vehicleId: string,
    seatNumber: string,
    floor?: number,
  ) {
    return this.prisma.vehicleSeat.findFirst({
      where: {
        seatNumber,
        floor: floor || undefined,
        VehicleLayout: {
          vehicleId,
          isActive: true,
        },
        status: 'ACTIVE',
      },
    });
  }

  // Xác nhận đặt chỗ (sau khi thanh toán)
  async confirmSeatBooking(bookingId: string): Promise<void> {
    await this.prisma.seatBooking.updateMany({
      where: {
        bookingId,
        status: 'RESERVED',
      },
      data: {
        status: 'CONFIRMED',
        reservedUntil: null,
      },
    });

    this.logger.log(`Confirmed seat booking ${bookingId}`);
  }

  // Hủy đặt chỗ
  async cancelSeatBooking(bookingId: string): Promise<void> {
    await this.prisma.seatBooking.updateMany({
      where: {
        bookingId,
        status: { in: ['RESERVED', 'CONFIRMED'] },
      },
      data: {
        status: 'CANCELLED',
      },
    });

    this.logger.log(`Cancelled seat booking ${bookingId}`);
  }

  // Xóa reservation hết hạn (chạy định kỳ)
  async cleanupExpiredReservations(): Promise<void> {
    const result = await this.prisma.seatBooking.updateMany({
      where: {
        status: 'RESERVED',
        reservedUntil: { lt: new Date() },
      },
      data: {
        status: 'CANCELLED',
      },
    });

    this.logger.log(`Cleaned up ${result.count} expired reservations`);
  }

  // Lấy thống kê chỗ ngồi theo xe và ngày
  async getSeatStatistics(
    vehicleId: string,
    startDate: string,
    endDate: string,
  ) {
    const bookings = await this.prisma.seatBooking.findMany({
      where: {
        VehicleSeat: {
          VehicleLayout: {
            vehicleId,
          },
        },
        departureDate: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
        status: 'CONFIRMED',
      },
      include: {
        VehicleSeat: true,
      },
    });

    // Group by seat type and position
    const stats = {
      totalBookings: bookings.length,
      bySeatType: {} as Record<string, number>,
      byPosition: {} as Record<string, number>,
      byFloor: {} as Record<number, number>,
      occupancyRate: 0,
    };

    bookings.forEach((booking) => {
      const seat = booking.VehicleSeat;

      stats.bySeatType[seat.seatType] =
        (stats.bySeatType[seat.seatType] || 0) + 1;
      stats.byPosition[seat.position] =
        (stats.byPosition[seat.position] || 0) + 1;
      stats.byFloor[seat.floor || 1] =
        (stats.byFloor[seat.floor || 1] || 0) + 1;
    });

    return stats;
  }

  // Tạo template layout cho các loại xe phổ biến
  async createStandardLayouts() {
    const layouts = [
      {
        name: 'Xe Limousine 34 chỗ',
        type: 'LIMOUSINE',
        totalSeats: 34,
        floors: 1,
        config: this.generateLimousine34Layout(),
      },
      {
        name: 'Xe giường nằm 40 chỗ 2 tầng',
        type: 'SLEEPER_BUS',
        totalSeats: 40,
        floors: 2,
        config: this.generateSleeperBus40Layout(),
      },
      {
        name: 'Xe khách 45 chỗ',
        type: 'COACH',
        totalSeats: 45,
        floors: 1,
        config: this.generateCoach45Layout(),
      },
    ];

    return layouts;
  }

  private generateLimousine34Layout() {
    // Implementation for limousine 34-seat layout
    const seats = [];
    let seatCount = 1;

    // 8 rows, 4 seats per row + 2 VIP seats at back
    for (let row = 1; row <= 8; row++) {
      for (let col = 0; col < 4; col++) {
        const column = String.fromCharCode('A'.charCodeAt(0) + col);
        seats.push({
          seatNumber: `${column}${row}`,
          row,
          column,
          floor: 1,
          seatType: row <= 2 ? 'VIP' : 'STANDARD',
          isAvailable: true,
        });
      }
    }

    // 2 VIP seats at the back
    seats.push(
      {
        seatNumber: 'V1',
        row: 9,
        column: 'V',
        floor: 1,
        seatType: 'VIP',
        isAvailable: true,
      },
      {
        seatNumber: 'V2',
        row: 9,
        column: 'W',
        floor: 1,
        seatType: 'VIP',
        isAvailable: true,
      },
    );

    return seats;
  }

  private generateSleeperBus40Layout() {
    // Implementation for 2-floor sleeper bus
    const seats = [];

    // Floor 1: 20 seats (10 rows, 2 seats per row)
    for (let row = 1; row <= 10; row++) {
      for (let col = 0; col < 2; col++) {
        const column = String.fromCharCode('A'.charCodeAt(0) + col);
        seats.push({
          seatNumber: `${column}${row}`,
          row,
          column,
          floor: 1,
          seatType: 'SLEEPER',
          isAvailable: true,
        });
      }
    }

    // Floor 2: 20 seats (10 rows, 2 seats per row)
    for (let row = 1; row <= 10; row++) {
      for (let col = 0; col < 2; col++) {
        const column = String.fromCharCode('A'.charCodeAt(0) + col);
        seats.push({
          seatNumber: `${column}${row}`,
          row,
          column,
          floor: 2,
          seatType: 'SLEEPER',
          isAvailable: true,
        });
      }
    }

    return seats;
  }

  private generateCoach45Layout() {
    // Implementation for standard 45-seat coach
    const seats = [];

    // 11 rows, 4 seats per row + 1 single seat
    for (let row = 1; row <= 11; row++) {
      const seatsInRow = row === 11 ? 1 : 4;
      for (let col = 0; col < seatsInRow; col++) {
        const column = String.fromCharCode('A'.charCodeAt(0) + col);
        seats.push({
          seatNumber: `${column}${row}`,
          row,
          column,
          floor: 1,
          seatType: 'STANDARD',
          isAvailable: true,
        });
      }
    }

    return seats;
  }
}
