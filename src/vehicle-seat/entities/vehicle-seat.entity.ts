import { ApiProperty } from '@nestjs/swagger';

export class VehicleSeatEntity {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  vehicleLayoutId!: string;

  @ApiProperty()
  seatNumber!: string;

  @ApiProperty()
  row!: number;

  @ApiProperty()
  column!: string;

  @ApiProperty()
  floor?: number;

  @ApiProperty()
  seatType!: string;

  @ApiProperty()
  position!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  price!: number;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class VehicleLayoutEntity {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  vehicleId!: string;

  @ApiProperty()
  layoutName!: string;

  @ApiProperty()
  vehicleType!: string;

  @ApiProperty()
  totalSeats!: number;

  @ApiProperty()
  hasMultipleFloors!: boolean;

  @ApiProperty()
  totalFloors!: number;

  @ApiProperty()
  description?: string;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty({ type: [VehicleSeatEntity] })
  seats!: VehicleSeatEntity[];

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  static fromPrisma(data: any): VehicleLayoutEntity {
    const entity = new VehicleLayoutEntity();
    entity.id = data.id;
    entity.vehicleId = data.vehicleId;
    entity.layoutName = data.layoutName;
    entity.vehicleType = data.vehicleType;
    entity.totalSeats = data.totalSeats;
    entity.hasMultipleFloors = data.hasMultipleFloors;
    entity.totalFloors = data.totalFloors;
    entity.description = data.description;
    entity.isActive = data.isActive;
    entity.createdAt = data.createdAt;
    entity.updatedAt = data.updatedAt;

    if (data.VehicleSeat) {
      entity.seats = data.VehicleSeat.map((seat: any) => {
        const seatEntity = new VehicleSeatEntity();
        seatEntity.id = seat.id;
        seatEntity.vehicleLayoutId = seat.vehicleLayoutId;
        seatEntity.seatNumber = seat.seatNumber;
        seatEntity.row = seat.row;
        seatEntity.column = seat.column;
        seatEntity.floor = seat.floor;
        seatEntity.seatType = seat.seatType;
        seatEntity.position = seat.position;
        seatEntity.status = seat.status;
        seatEntity.price = Number(seat.price);
        seatEntity.createdAt = seat.createdAt;
        seatEntity.updatedAt = seat.updatedAt;
        return seatEntity;
      });
    }

    return entity;
  }
}

export class SeatBookingEntity {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  scheduleId!: string;

  @ApiProperty()
  vehicleSeatId!: string;

  @ApiProperty()
  bookingId!: string;

  @ApiProperty()
  passengerName!: string;

  @ApiProperty()
  passengerPhone?: string;

  @ApiProperty()
  passengerIdNumber?: string;

  @ApiProperty()
  passengerAge?: number;

  @ApiProperty()
  passengerGender?: string;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  departureDate!: Date;

  @ApiProperty()
  departureTime!: string;

  @ApiProperty()
  reservedUntil?: Date;

  @ApiProperty()
  specialRequests?: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiProperty({ type: VehicleSeatEntity })
  seat?: VehicleSeatEntity;

  static fromPrisma(data: any): SeatBookingEntity {
    const entity = new SeatBookingEntity();
    entity.id = data.id;
    entity.scheduleId = data.scheduleId;
    entity.vehicleSeatId = data.vehicleSeatId;
    entity.bookingId = data.bookingId;
    entity.passengerName = data.passengerName;
    entity.passengerPhone = data.passengerPhone;
    entity.passengerIdNumber = data.passengerIdNumber;
    entity.passengerAge = data.passengerAge;
    entity.passengerGender = data.passengerGender;
    entity.status = data.status;
    entity.departureDate = data.departureDate;
    entity.departureTime = data.departureTime;
    entity.reservedUntil = data.reservedUntil;
    entity.specialRequests = data.specialRequests;
    entity.createdAt = data.createdAt;
    entity.updatedAt = data.updatedAt;

    if (data.VehicleSeat) {
      const seatEntity = new VehicleSeatEntity();
      const seat = data.VehicleSeat;
      seatEntity.id = seat.id;
      seatEntity.vehicleLayoutId = seat.vehicleLayoutId;
      seatEntity.seatNumber = seat.seatNumber;
      seatEntity.row = seat.row;
      seatEntity.column = seat.column;
      seatEntity.floor = seat.floor;
      seatEntity.seatType = seat.seatType;
      seatEntity.position = seat.position;
      seatEntity.status = seat.status;
      seatEntity.price = Number(seat.price);
      seatEntity.createdAt = seat.createdAt;
      seatEntity.updatedAt = seat.updatedAt;
      entity.seat = seatEntity;
    }

    return entity;
  }
}

export class VehicleScheduleEntity {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  vehicleId!: string;

  @ApiProperty()
  routeId!: string;

  @ApiProperty()
  departureDate!: Date;

  @ApiProperty()
  departureTime!: string;

  @ApiProperty()
  arrivalTime!: string;

  @ApiProperty()
  driverName!: string;

  @ApiProperty()
  driverPhone?: string;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  basePrice!: number;

  @ApiProperty()
  totalSeats!: number;

  @ApiProperty()
  availableSeats!: number;

  @ApiProperty()
  bookedSeats!: number;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiProperty({ type: [SeatBookingEntity] })
  seatBookings!: SeatBookingEntity[];

  static fromPrisma(data: any): VehicleScheduleEntity {
    const entity = new VehicleScheduleEntity();
    entity.id = data.id;
    entity.vehicleId = data.vehicleId;
    entity.routeId = data.routeId;
    entity.departureDate = data.departureDate;
    entity.departureTime = data.departureTime;
    entity.arrivalTime = data.arrivalTime;
    entity.driverName = data.driverName;
    entity.driverPhone = data.driverPhone;
    entity.status = data.status;
    entity.basePrice = Number(data.basePrice);
    entity.totalSeats = data.totalSeats;
    entity.availableSeats = data.availableSeats;
    entity.bookedSeats = data.bookedSeats;
    entity.createdAt = data.createdAt;
    entity.updatedAt = data.updatedAt;

    if (data.SeatBooking) {
      entity.seatBookings = data.SeatBooking.map((booking: any) =>
        SeatBookingEntity.fromPrisma(booking),
      );
    }

    return entity;
  }
}
