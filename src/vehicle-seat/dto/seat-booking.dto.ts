import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PassengerInfoDto {
  @ApiProperty({ description: 'Passenger name' })
  @IsString()
  name!: string;

  @ApiProperty({ description: 'Passenger phone', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ description: 'ID number', required: false })
  @IsOptional()
  @IsString()
  idNumber?: string;

  @ApiProperty({ description: 'Passenger age', required: false })
  @IsOptional()
  @IsNumber()
  age?: number;

  @ApiProperty({ description: 'Passenger gender', required: false })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiProperty({ description: 'Special requests', required: false })
  @IsOptional()
  @IsString()
  specialRequests?: string;
}

export class SeatSelectionDto {
  @ApiProperty({ description: 'Seat number (A1, B2, etc.)' })
  @IsString()
  seatNumber!: string;

  @ApiProperty({ description: 'Floor number', required: false })
  @IsOptional()
  @IsNumber()
  floor?: number;

  @ApiProperty({ description: 'Passenger information', type: PassengerInfoDto })
  @ValidateNested()
  @Type(() => PassengerInfoDto)
  passenger!: PassengerInfoDto;
}

export class BookSeatsDto {
  @ApiProperty({ description: 'Vehicle ID' })
  @IsString()
  vehicleId!: string;

  @ApiProperty({ description: 'Schedule ID for specific trip' })
  @IsString()
  scheduleId!: string;

  @ApiProperty({ description: 'Departure date (YYYY-MM-DD)' })
  @IsString()
  departureDate!: string;

  @ApiProperty({ description: 'Departure time (HH:mm)' })
  @IsString()
  departureTime!: string;

  @ApiProperty({
    description: 'Selected seats with passenger info',
    type: [SeatSelectionDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SeatSelectionDto)
  selectedSeats!: SeatSelectionDto[];

  @ApiProperty({ description: 'Customer name' })
  @IsString()
  customerName!: string;

  @ApiProperty({ description: 'Customer phone' })
  @IsString()
  customerPhone!: string;

  @ApiProperty({ description: 'Customer email', required: false })
  @IsOptional()
  @IsString()
  customerEmail?: string;

  @ApiProperty({ description: 'Pickup location', required: false })
  @IsOptional()
  @IsString()
  pickupLocation?: string;

  @ApiProperty({ description: 'Drop-off location', required: false })
  @IsOptional()
  @IsString()
  dropoffLocation?: string;

  @ApiProperty({ description: 'Additional notes', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class SeatStatus {
  @ApiProperty({ description: 'Seat number' })
  seatNumber!: string;

  @ApiProperty({ description: 'Floor number', required: false })
  floor?: number;

  @ApiProperty({
    description: 'Seat status',
    enum: ['AVAILABLE', 'BOOKED', 'RESERVED', 'MAINTENANCE'],
  })
  status!: string;

  @ApiProperty({ description: 'Passenger name if booked', required: false })
  passengerName?: string;

  @ApiProperty({ description: 'Booking ID if booked', required: false })
  bookingId?: string;

  @ApiProperty({ description: 'Reserved until timestamp', required: false })
  reservedUntil?: Date;

  @ApiProperty({ description: 'Seat type' })
  seatType!: string;

  @ApiProperty({ description: 'Seat position', required: false })
  position?: string;

  @ApiProperty({ description: 'Seat price in VND' })
  price!: number;
}

export class FloorSeatMap {
  @ApiProperty({ description: 'Floor number' })
  floorNumber!: number;

  @ApiProperty({ description: 'Total rows' })
  totalRows!: number;

  @ApiProperty({ description: 'Seats per row' })
  seatsPerRow!: number;

  @ApiProperty({ description: 'Seat statuses', type: [SeatStatus] })
  seats!: SeatStatus[];

  @ApiProperty({ description: 'Layout JSON string' })
  layout!: string;
}

export class VehicleSeatMap {
  @ApiProperty({ description: 'Vehicle ID' })
  vehicleId!: string;

  @ApiProperty({ description: 'Layout name' })
  layoutName!: string;

  @ApiProperty({ description: 'Total seats' })
  totalSeats!: number;

  @ApiProperty({ description: 'Available seats' })
  availableSeats!: number;

  @ApiProperty({ description: 'Booked seats' })
  bookedSeats!: number;

  @ApiProperty({ description: 'Has multiple floors' })
  hasMultipleFloors!: boolean;

  @ApiProperty({ description: 'Total floors' })
  totalFloors!: number;

  @ApiProperty({ description: 'Floor seat maps', type: [FloorSeatMap] })
  floors!: FloorSeatMap[];
}
