import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SeatConfigDto {
  @ApiProperty({ description: 'Seat number (A1, B2, etc.)' })
  @IsString()
  seatNumber!: string;

  @ApiProperty({ description: 'Row number' })
  @IsNumber()
  row!: number;

  @ApiProperty({ description: 'Column letter (A, B, C, D)' })
  @IsString()
  column!: string;

  @ApiProperty({ description: 'Floor number (1 or 2)', required: false })
  @IsOptional()
  @IsNumber()
  floor?: number;

  @ApiProperty({
    description: 'Seat type',
    enum: ['STANDARD', 'VIP', 'SLEEPER'],
  })
  @IsString()
  seatType!: string;

  @ApiProperty({
    description: 'Seat availability',
    default: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @ApiProperty({
    description: 'Seat position',
    enum: ['WINDOW', 'AISLE', 'MIDDLE'],
    required: false,
  })
  @IsOptional()
  @IsString()
  position?: string;
}

export class FloorLayoutDto {
  @ApiProperty({ description: 'Floor number' })
  @IsNumber()
  floorNumber!: number;

  @ApiProperty({ description: 'Total rows on this floor' })
  @IsNumber()
  totalRows!: number;

  @ApiProperty({ description: 'Seats per row' })
  @IsNumber()
  seatsPerRow!: number;

  @ApiProperty({
    description: 'Array of seat configurations',
    type: [SeatConfigDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SeatConfigDto)
  seats!: SeatConfigDto[];
}

export class CreateVehicleLayoutDto {
  @ApiProperty({ description: 'Vehicle ID' })
  @IsString()
  vehicleId!: string;

  @ApiProperty({ description: 'Layout name (e.g., "Limousine 34 chỗ")' })
  @IsString()
  layoutName!: string;

  @ApiProperty({
    description: 'Vehicle type',
    enum: ['BUS', 'COACH', 'LIMOUSINE', 'SLEEPER_BUS'],
  })
  @IsString()
  vehicleType!: string;

  @ApiProperty({ description: 'Total number of seats' })
  @IsNumber()
  totalSeats!: number;

  @ApiProperty({
    description: 'Whether vehicle has multiple floors',
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  hasMultipleFloors?: boolean;

  @ApiProperty({
    description: 'Total number of floors',
    default: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  totalFloors?: number;

  @ApiProperty({
    description: 'Floor layouts configuration',
    type: [FloorLayoutDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FloorLayoutDto)
  floorLayouts!: FloorLayoutDto[];

  @ApiProperty({ description: 'Layout description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Whether layout is active',
    default: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
