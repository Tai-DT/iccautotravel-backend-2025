import {
  IsString,
  IsOptional,
  IsNumber,
  Min,
  IsBoolean,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';

export class CalculateRentalPriceByKmDto {
  @ApiProperty({ description: 'ID loại xe' })
  @IsString()
  vehicleTypeId: string = '';

  @ApiProperty({ description: 'Địa chỉ xuất phát' })
  @IsString()
  startAddress: string = '';

  @ApiProperty({ description: 'Địa chỉ đích' })
  @IsString()
  endAddress: string = '';

  @ApiProperty({
    description: 'Vùng hoạt động',
    required: false,
    default: 'toàn quốc',
  })
  @IsString()
  @IsOptional()
  region: string = 'toàn quốc';

  @ApiProperty({
    description: 'Đơn giá ghi đè (nếu muốn áp dụng)',
    required: false,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  overrideUnitPrice?: number;

  @ApiProperty({
    description: 'Phí phụ trội (cầu đường, qua đêm...)',
    required: false,
    default: 0,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  extraFee: number = 0;

  @ApiProperty({
    description: 'Chuyến khứ hồi?',
    required: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  isRoundTrip: boolean = false;

  @ApiProperty({
    description: 'Danh sách các điểm dừng trung gian',
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsString({ each: true })
  @Type(() => Array)
  intermediateStops?: string[] = [];

  @ApiProperty({ description: 'Ghi chú', required: false })
  @IsOptional()
  @IsString()
  notes?: string = '';
}

export class PriceByKmResult {
  constructor(
    public vehicleType: string = '',
    public startAddress: string = '',
    public endAddress: string = '',
    public distanceKm: number = 0,
    public unitPrice: number = 0,
    public totalPrice: number = 0,
    public intermediateStops?: string[],
    public extraFee?: number,
    public isRoundTrip?: boolean,
    public notes?: string,
    public region?: string,
    public estimatedDuration?: number,
  ) {}
}
