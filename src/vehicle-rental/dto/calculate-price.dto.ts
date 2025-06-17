import {
  IsString,
  IsDateString,
  IsOptional,
  IsBoolean,
  IsNumber,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';

export class CalculateRentalPriceDto {
  @ApiProperty({ description: 'ID loại xe' })
  @IsString()
  vehicleTypeId: string = '';

  @ApiProperty({ description: 'ID tuyến đường' })
  @IsString()
  routeId: string = '';

  @ApiProperty({ description: 'Thời gian bắt đầu' })
  @IsDateString()
  startTime: string = '';

  @ApiProperty({ description: 'Thời gian kết thúc' })
  @IsDateString()
  endTime: string = '';

  @ApiProperty({ description: 'Số đêm lưu trú', required: false, default: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  overnightNights?: number = 0;

  @ApiProperty({
    description: 'Là cuối tuần hay không',
    required: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  isWeekend?: boolean = false;

  @ApiProperty({
    description: 'Là ngày lễ hay không',
    required: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  isHoliday?: boolean = false;

  @ApiProperty({
    description: 'Yêu cầu VAT hay không',
    required: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  requireVat?: boolean = false;

  @ApiProperty({ description: 'Phụ phí thủ công', required: false, default: 0 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  surchargeManual?: number = 0;
}

export class PriceCalculationResult {
  constructor() {
    this.basePrice = 0;
    this.surcharge = 0;
    this.overnightFee = 0;
    this.subtotal = 0;
    this.total = 0;
    this.ratio = 1;
    this.standardHours = 0;
    this.actualHours = 0;
    this.surchargeHours = 0;
    this.details = {
      vehicleType: '',
      route: '',
      startTime: '',
      endTime: '',
      overnightNights: 0,
      isWeekend: false,
      isHoliday: false,
      requireVat: false,
      surchargeManual: 0,
    };
  }
  basePrice: number;
  surcharge: number;
  overnightFee: number;
  subtotal: number;
  total: number;
  ratio: number;
  standardHours: number;
  actualHours: number;
  surchargeHours: number;
  details: {
    vehicleType: string;
    route: string;
    startTime: string;
    endTime: string;
    overnightNights: number;
    isWeekend: boolean;
    isHoliday: boolean;
    requireVat: boolean;
    surchargeManual: number;
  };
}
