import {
  IsString,
  IsOptional,
  IsDecimal,
  IsNumber,
  IsUUID,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateFastTrackDetailDto {
  @ApiPropertyOptional({
    description:
      'Service ID to link this detail to (optional, will create new service if not provided)',
  })
  @IsOptional()
  @IsUUID()
  serviceId?: string;

  @ApiProperty({
    description: 'Airport code for fast track service',
    example: 'HAN',
  })
  @IsString()
  airportCode: string;

  @ApiProperty({
    description: 'Service level (Standard, Premium, VIP)',
    example: 'Standard',
  })
  @IsString()
  serviceLevel: string;

  @ApiProperty({
    description: 'Base price for the fast track service',
    example: 800000,
  })
  @IsNumber()
  @Type(() => Number)
  basePrice: number;

  @ApiPropertyOptional({
    description: 'Description of the fast track service',
    example: 'Priority immigration and security clearance',
  })
  @IsOptional()
  @IsString()
  description?: string;

  // Service data (if creating new service)
  @ApiPropertyOptional({
    description: 'Service name (required if not providing serviceId)',
    example: 'Hanoi Airport Fast Track',
  })
  @IsOptional()
  @IsString()
  serviceName?: string;

  @ApiPropertyOptional({
    description: 'Service description (for new service)',
    example: 'Fast track service at Hanoi airport',
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
