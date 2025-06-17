import {
  IsString,
  IsOptional,
  IsNumber,
  IsUUID,
  IsEnum,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';

export class CreateVehicleDetailDto {
  @ApiPropertyOptional({
    description:
      'Service ID to link this detail to (optional, will create new service if not provided)',
  })
  @IsOptional()
  @IsUUID()
  serviceId?: string;

  @ApiProperty({
    description: 'Type of vehicle',
    example: 'Sedan',
  })
  @IsString()
  vehicleType: string;

  @ApiPropertyOptional({
    description: 'Vehicle brand',
    example: 'Toyota',
  })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiProperty({
    description: 'Vehicle model',
    example: 'Camry',
  })
  @IsString()
  model: string;

  @ApiPropertyOptional({
    description: 'Vehicle license plate',
    example: '30A-12345',
  })
  @IsOptional()
  @IsString()
  licensePlate?: string;

  @ApiProperty({
    description: 'Number of seats',
    example: 5,
  })
  @IsNumber()
  @Min(1)
  @Max(50)
  @Type(() => Number)
  seats: number;

  @ApiPropertyOptional({
    description: 'Fuel type',
    example: 'Petrol',
  })
  @IsOptional()
  @IsString()
  fuelType?: string;

  @ApiProperty({
    description: 'Price per day',
    example: 1000000,
  })
  @IsNumber()
  @Type(() => Number)
  pricePerDay: number;

  @ApiPropertyOptional({
    description: 'Additional features/extras',
  })
  @IsOptional()
  extras?: any;

  @ApiPropertyOptional({
    description: 'Pickup location',
    example: 'Hanoi Airport',
  })
  @IsOptional()
  @IsString()
  pickupLocation?: string;

  @ApiPropertyOptional({
    description: 'Pickup latitude',
    example: 21.0285,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  pickupLatitude?: number;

  @ApiPropertyOptional({
    description: 'Pickup longitude',
    example: 105.8542,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  pickupLongitude?: number;

  @ApiPropertyOptional({
    description: 'Dropoff location',
    example: 'Hanoi City Center',
  })
  @IsOptional()
  @IsString()
  dropoffLocation?: string;

  @ApiPropertyOptional({
    description: 'Dropoff latitude',
    example: 21.0285,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  dropoffLatitude?: number;

  @ApiPropertyOptional({
    description: 'Dropoff longitude',
    example: 105.8542,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  dropoffLongitude?: number;

  @ApiPropertyOptional({
    description: 'Vehicle description',
    example: 'Comfortable sedan for city travel',
  })
  @IsOptional()
  @IsString()
  description?: string;

  // Service data (if creating new service)
  @ApiPropertyOptional({
    description: 'Service name (required if not providing serviceId)',
    example: 'Toyota Camry Rental',
  })
  @IsOptional()
  @IsString()
  serviceName?: string;

  @ApiPropertyOptional({
    description: 'Service description (for new service)',
    example: 'Comfortable sedan rental service',
  })
  @IsOptional()
  @IsString()
  serviceDescription?: string;

  @ApiPropertyOptional({
    description: 'Whether the service is active',
    default: true,
  })
  @IsOptional()
  isActive?: boolean;
}
