import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import {
  CalculateRentalPriceDto,
  PriceCalculationResult,
} from './dto/calculate-price.dto';

@Injectable()
export class PriceCalculationService {
  private readonly logger = new Logger(PriceCalculationService.name);
  // Constants for business rules
  private readonly SURCHARGE_HALF_HOUR_MINUTES = 10;
  private readonly SURCHARGE_FULL_HOUR_MINUTES = 40;
  private readonly DEFAULT_HOLIDAY_RATIO = 1.5;
  private readonly DEFAULT_WEEKEND_RATIO = 1.2;
  private readonly DEFAULT_VAT_RATE = 1.1; // 10% VAT

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  /**
   * Tính toán giá thuê xe dựa trên các thông số đầu vào
   */
  async calculateRentalPrice(
    data: CalculateRentalPriceDto,
    userId?: string,
  ): Promise<PriceCalculationResult> {
    this.logger.log(
      `Tính giá thuê xe cho loại xe ${data.vehicleTypeId}, tuyến ${data.routeId}`,
    );

    // 1. Lấy thông tin về giá và giờ chuẩn từ cơ sở dữ liệu
    const priceInfo = await this.getPriceAndHours(
      data.vehicleTypeId,
      data.routeId,
    );
    if (!priceInfo) {
      throw new NotFoundException(
        'Không tìm thấy bảng giá cho tuyến và loại xe này',
      );
    }

    // 2. Tính số giờ thực tế (UTC)
    const startTime = new Date(data.startTime);
    const endTime = new Date(data.endTime);
    // Ensure UTC
    const totalHoursExact =
      (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);

    // 3. Tính phụ phí vượt giờ
    let surcharge = 0;
    let surchargeHours = 0;

    if (totalHoursExact > (priceInfo.standardHours || 0)) {
      const extraHours = totalHoursExact - (priceInfo.standardHours || 0);
      const fullHours = Math.floor(extraHours);
      const partial = extraHours - fullHours;

      // Quy tắc làm tròn: 10-39 phút tính 0.5 giờ, 40-60 phút tính 1 giờ
      const minutes = partial * 60;
      if (minutes >= this.SURCHARGE_FULL_HOUR_MINUTES) {
        surchargeHours = fullHours + 1;
      } else if (minutes >= this.SURCHARGE_HALF_HOUR_MINUTES) {
        surchargeHours = fullHours + 0.5;
      } else {
        surchargeHours = fullHours;
      }

      surcharge = surchargeHours * Number(priceInfo.surchargePerHour || 0);
    }

    // 4. Tính phí lưu đêm (nếu có)
    const overnightFee =
      (data.overnightNights || 0) * Number(priceInfo.overnightFee || 0);

    // 5. Áp dụng hệ số tăng giá cho cuối tuần/ngày lễ
    const ratio = await this.calculatePriceRatio(
      data.isWeekend,
      data.isHoliday,
    );

    // 6. Tính tổng tiền trước VAT
    const surchargeManual = data.surchargeManual || 0;
    const subtotal =
      (Number(priceInfo.basePrice || 0) +
        surcharge +
        overnightFee +
        surchargeManual) *
      ratio;

    // 7. Áp dụng VAT nếu cần
    const vatRate = await this.getVatRate();
    const total = data.requireVat ? subtotal * vatRate : subtotal;

    // 8. Lưu log tính giá nếu cần
    if (userId) {
      await this.logPriceCalculation({
        vehicleTypeId: data.vehicleTypeId,
        routeId: data.routeId,
        startTime,
        endTime,
        overnightNights: data.overnightNights || 0,
        isWeekend: data.isWeekend || false,
        isHoliday: data.isHoliday || false,
        requireVat: data.requireVat || false,
        basePrice: priceInfo.basePrice,
        surcharge,
        overnightFee,
        manualSurcharge: surchargeManual,
        subtotal,
        total,
        appliedRatio: ratio,
        calculatedBy: userId,
      });
    }

    // 9. Trả v��� kết quả chi tiết
    return {
      basePrice: Number(priceInfo.basePrice || 0),
      surcharge,
      overnightFee,
      subtotal,
      total,
      ratio,
      standardHours: priceInfo.standardHours || 0,
      actualHours: Number(totalHoursExact.toFixed(2)),
      surchargeHours,
      details: {
        vehicleType: priceInfo.vehicleTypeName,
        route: priceInfo.routeName,
        startTime: data.startTime,
        endTime: data.endTime,
        overnightNights: data.overnightNights || 0,
        isWeekend: data.isWeekend || false,
        isHoliday: data.isHoliday || false,
        requireVat: data.requireVat || false,
        surchargeManual: surchargeManual,
      },
    };
  }

  /**
   * Lấy thông tin giá và số giờ chuẩn cho một tuyến và loại xe cụ thể
   */
  private async getPriceAndHours(vehicleTypeId: string, routeId: string) {
    // Lấy thông tin từ bảng giá
    const priceInfo = await this.prisma.vehicleRentalPrice.findFirst({
      where: {
        vehicleTypeId,
        routeId,
        isActive: true,
      },
      include: {
        VehicleType: true,
      },
    });

    if (!priceInfo) {
      return null;
    }

    // Get route separately since it might not be includable directly
    const route = await this.prisma.route.findUnique({
      where: { id: priceInfo.routeId || '' },
    });

    return this.mapPriceInfoToResponse(priceInfo, route);
  }

  /**
   * Map price info and route to response format
   */
  private mapPriceInfoToResponse(priceInfo: any, route: any): any {
    return {
      basePrice: priceInfo.price || 0, // Changed from basePrice to price based on schema
      standardHours: priceInfo.hours || 0, // Changed from standardHours to hours based on schema
      surchargePerHour: 0, // Set default value instead of accessing undefined property
      overnightFee: 0, // Set default value instead of accessing undefined property
      vehicleTypeName: priceInfo.vehicleType?.name || '',
      routeName:
        route?.fromLocation && route?.toLocation
          ? `${route.fromLocation} to ${route.toLocation}`
          : '', // Use available properties
    };
  }

  /**
   * Tính hệ số tăng giá dựa trên cuối tuần/ngày lễ
   */
  private async calculatePriceRatio(
    isWeekend: boolean = false,
    isHoliday: boolean = false,
  ): Promise<number> {
    // Ưu tiên ngày lễ trước ngày cuối tuần
    if (isHoliday) {
      return this.getHolidayRatio();
    } else if (isWeekend) {
      return this.getWeekendRatio();
    }
    return 1.0; // Ngày thường, không tăng giá
  }

  /**
   * Lấy hệ số tăng giá cho ngày lễ
   */
  private async getHolidayRatio(): Promise<number> {
    try {
      const config = await this.prisma.rentalConfig.findUnique({
        where: { key: 'holiday_rate' },
      });
      // Handle potential null value properly
      return config && config.value
        ? parseFloat(String(config.value))
        : this.DEFAULT_HOLIDAY_RATIO;
    } catch (error) {
      this.logger.error('Lỗi khi lấy hệ số ngày lễ', error);
      return this.DEFAULT_HOLIDAY_RATIO; // Giá trị mặc định
    }
  }

  /**
   * Lấy hệ số tăng giá cho ngày cuối tuần
   */
  private async getWeekendRatio(): Promise<number> {
    try {
      const config = await this.prisma.rentalConfig.findUnique({
        where: { key: 'weekend_rate' },
      });
      // Handle potential null value properly
      return config && config.value
        ? parseFloat(String(config.value))
        : this.DEFAULT_WEEKEND_RATIO;
    } catch (error) {
      this.logger.error('Lỗi khi lấy hệ số cuối tuần', error);
      return this.DEFAULT_WEEKEND_RATIO; // Giá trị mặc định
    }
  }

  /**
   * Lấy tỷ lệ VAT
   */
  private async getVatRate(): Promise<number> {
    try {
      const config = await this.prisma.rentalConfig.findUnique({
        where: { key: 'vat_rate' },
      });
      // Handle potential null value properly
      return config && config.value
        ? parseFloat(String(config.value))
        : this.DEFAULT_VAT_RATE;
    } catch (error) {
      this.logger.error('Lỗi khi lấy tỷ lệ VAT', error);
      return this.DEFAULT_VAT_RATE; // Giá trị mặc định
    }
  }

  /**
   * Lưu log về việc tính giá
   */
  private async logPriceCalculation(data: any): Promise<void> {
    try {
      await this.prisma.rentalPriceLog.create({
        data: {
          id: `pricelog_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          ...data,
        },
      });
    } catch (error) {
      this.logger.error('Lỗi khi lưu log tính giá', error);
    }
  }
}
