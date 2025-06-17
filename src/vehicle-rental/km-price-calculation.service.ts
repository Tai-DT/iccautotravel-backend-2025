import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import {
  CalculateRentalPriceByKmDto,
  PriceByKmResult,
} from './dto/calculate-price-by-km.dto';
import { firstValueFrom } from 'rxjs';
import {
  formatError,
  getErrorMessage,
  getErrorStack,
  logError,
} from '../utils/error-handler.util';

interface GoongMapDirectionsResponse {
  routes: {
    legs: {
      distance: {
        value: number;
        text: string;
      };
      duration: {
        value: number;
        text: string;
      };
    }[];
  }[];
}

@Injectable()
export class KmPriceCalculationService {
  private readonly logger = new Logger(KmPriceCalculationService.name);
  private readonly goongApiKey: string = '';

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private httpService: HttpService,
  ) {
    const apiKey = this.configService.get<string>('GOONG_API_KEY');
    if (apiKey) {
      this.goongApiKey = apiKey;
    } else {
      this.logger.warn('GOONG_API_KEY không được cấu hình trong .env!');
    }
  }

  /**
   * Tính giá thuê xe dựa trên khoảng cách km
   */
  async calculateRentalPriceByKm(
    data: CalculateRentalPriceByKmDto,
    userId?: string,
  ): Promise<PriceByKmResult> {
    this.logger.log(
      `Tính giá thuê xe theo km cho loại xe ${data.vehicleTypeId}`,
    );

    try {
      // 1. Chuyển đổi địa chỉ thành tọa độ (làm đơn giản, có thể mở rộng sau)
      // Trong triển khai thực tế, cần gọi API Goong Maps để geocode địa chỉ thành tọa độ

      // 2. Gọi API Goong Maps để lấy khoảng cách
      let distanceKm: number;

      if (data.intermediateStops && data.intermediateStops.length > 0) {
        // Nếu có các điểm dừng trung gian, tính tổng khoảng cách qua tất cả các điểm
        distanceKm = await this.calculateMultiPointDistance(
          data.startAddress,
          data.endAddress,
          data.intermediateStops,
        );
      } else {
        // Trường hợp đơn giản: chỉ có điểm đầu và điểm cuối
        distanceKm = await this.getDistanceFromGoongMap(
          data.startAddress,
          data.endAddress,
        );
      }

      // 3. Tìm đơn giá theo loại xe và vùng hoạt động
      const unitPrice =
        data.overrideUnitPrice ||
        (await this.getUnitPricePerKm(data.vehicleTypeId, data.region));

      // 4. Nếu là chuyến khứ hồi, nhân đôi khoảng cách
      // Hoặc áp dụng hệ số nếu có cấu hình khác
      if (data.isRoundTrip) {
        const roundTripFactor = await this.getRoundTripFactor();
        distanceKm *= roundTripFactor;
      }

      // 5. Tính tổng giá
      let totalPrice = distanceKm * unitPrice;

      // 6. Thêm phí phụ trội nếu có
      if (data.extraFee && data.extraFee > 0) {
        totalPrice += data.extraFee;
      }

      // 7. Lấy thông tin loại xe
      const vehicleType = await this.prisma.vehicleType.findUnique({
        where: { id: data.vehicleTypeId },
      });

      if (!vehicleType) {
        throw new HttpException('Không tìm thấy loại xe', HttpStatus.NOT_FOUND);
      }

      // 8. Lưu lịch sử tính giá
      if (userId) {
        await this.logPriceCalculationByKm({
          vehicleTypeId: data.vehicleTypeId,
          startAddress: data.startAddress,
          endAddress: data.endAddress,
          distanceKm,
          unitPrice,
          totalPrice,
          region: data.region || 'toàn quốc',
          overrideUnitPrice: data.overrideUnitPrice,
          extraFee: data.extraFee || 0,
          notes: data.notes,
          calculatedBy: userId,
        });
      }

      // 9. Trả về kết quả
      return {
        vehicleType: vehicleType.name,
        startAddress: data.startAddress,
        endAddress: data.endAddress,
        distanceKm,
        unitPrice,
        totalPrice,
        intermediateStops: data.intermediateStops,
        extraFee: data.extraFee,
        isRoundTrip: data.isRoundTrip,
        notes: data.notes,
      };
    } catch (error) {
      this.logger.error(
        `Lỗi khi tính giá theo km: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      const formattedError = formatError(error, 'Lỗi khi tính giá theo km');
      throw new HttpException(formattedError.message, formattedError.status);
    }
  }

  /**
   * Tính thời gian di chuyển dự kiến từ khoảng cách
   * @param distanceKm Khoảng cách theo km
   */
  public calculateEstimatedTravelTime(distanceKm: number): {
    hours: number;
    minutes: number;
  } {
    // Giả định tốc độ trung bình 50km/h cho xe ô tô
    const avgSpeedKmPerHour = 50;
    const totalHours = distanceKm / avgSpeedKmPerHour;

    const hours = Math.floor(totalHours);
    const minutes = Math.floor((totalHours - hours) * 60);

    return { hours, minutes };
  }

  /**
   * Đề xuất loại xe phù hợp dựa trên số lượng người và hành lý
   * @param passengers Số lượng người
   * @param luggage Số lượng hành lý (nhỏ/vừa/lớn)
   */
  public async suggestVehicleType(
    passengers: number,
    luggage: 'small' | 'medium' | 'large' = 'medium',
  ): Promise<string[]> {
    try {
      // Lấy danh sách tất cả các loại xe đang hoạt động
      const vehicleTypes = await this.prisma.vehicleType.findMany({
        // Using standard filter that exists in VehicleTypeWhereInput
        where: {},
        orderBy: { capacity: 'asc' },
      });

      // Tạo các hệ số cho hành lý
      const luggageFactors = {
        small: 0.5,
        medium: 1,
        large: 1.5,
      };

      // Điều chỉnh số lượng người theo hệ số hành lý
      const adjustedPassengers = passengers * luggageFactors[luggage];

      // Tìm các loại xe phù hợp (đảm bảo có đủ chỗ cho người và hành lý)
      const suitableVehicles = vehicleTypes
        .filter((v) => v.capacity >= adjustedPassengers)
        .map((v) => v.id);

      return suitableVehicles;
    } catch (error) {
      logError(this.logger, 'Lỗi khi đề xuất loại xe', error);
      return [];
    }
  }

  /**
   * Kiểm tra và cập nhật đơn giá/km cho loại xe và vùng cụ thể
   * Hữu ích cho việc đồng bộ giá từ file Excel vào hệ thống
   */
  public async upsertKmPrice(
    vehicleTypeId: string,
    region: string,
    pricePerKm: number,
    updatedBy: string,
  ): Promise<any> {
    try {
      // Kiểm tra xem loại xe có tồn tại không
      const vehicleType = await this.prisma.vehicleType.findUnique({
        where: { id: vehicleTypeId },
      });

      if (!vehicleType) {
        throw new Error(`Không tìm thấy loại xe với id: ${vehicleTypeId}`);
      }

      // Cập nhật hoặc tạo mới bảng giá
      const result = await this.prisma.vehiclePricePerKm.upsert({
        where: {
          // Use a unique ID if available instead of a composite key
          id:
            (await this.findPriceId(vehicleTypeId, region)) ||
            'non-existent-id',
        },
        update: {
          pricePerKm,
          updatedAt: new Date(),
        },
        create: {
          id: `kmprice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          VehicleType: { connect: { id: vehicleTypeId } },
          pricePerKm,
          minKm: 0, // Using minKm instead of minDistance which doesn't exist
          isActive: true, // Add required field
          updatedAt: new Date(),
          createdAt: new Date(),
        },
      });

      // Ghi log cập nhật giá
      await this.prisma.rentalConfig.create({
        data: {
          id: `priceupdate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          key: `price_update_${vehicleTypeId}_${region}`,
          value: pricePerKm.toString(),
          updatedAt: new Date(),
          createdAt: new Date(),
        },
      });

      return result;
    } catch (error) {
      this.logger.error(
        `Lỗi khi cập nhật đơn giá/km: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      const formattedError = formatError(error, 'Lỗi khi cập nhật đơn giá/km');
      throw new HttpException(formattedError.message, formattedError.status);
    }
  }

  /**
   * Tạo bảng báo giá với nhiều điểm đến
   * Hữu ích cho tạo báo giá so sánh cho khách hàng
   */
  public async createPriceQuotation(
    vehicleTypeId: string,
    startAddress: string,
    destinations: string[],
    options: {
      isRoundTrip?: boolean;
      overrideUnitPrice?: number;
    } = {},
  ): Promise<any[]> {
    try {
      const result = [];

      for (const destination of destinations) {
        // Tính giá cho từng điểm đến
        const priceData: CalculateRentalPriceByKmDto = {
          vehicleTypeId: vehicleTypeId,
          startAddress: startAddress,
          endAddress: destination,
          isRoundTrip: options.isRoundTrip || false,
          overrideUnitPrice: options.overrideUnitPrice,
          region: 'default', // Default region if not specified
          extraFee: 0, // Default extraFee if not specified
        };

        const price = await this.calculateRentalPriceByKm(priceData);
        result.push({
          destination,
          ...price,
        });
      }

      return result;
    } catch (error) {
      this.logger.error(
        `Lỗi khi tạo bảng báo giá: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      const formattedError = formatError(error, 'Lỗi khi tạo bảng báo giá');
      throw new HttpException(formattedError.message, formattedError.status);
    }
  }

  /**
   * Tính toán chi phí nhiên liệu dựa trên khoảng cách và loại xe
   * Có thể sử dụng để hiển thị chi tiết cấu thành giá
   */
  public async calculateFuelCost(
    vehicleTypeId: string,
    distanceKm: number,
  ): Promise<number> {
    try {
      const vehicleType = await this.prisma.vehicleType.findUnique({
        where: { id: vehicleTypeId },
      });

      if (!vehicleType) {
        throw new Error(`Không tìm thấy loại xe với id: ${vehicleTypeId}`);
      }

      // Định mức tiêu thụ nhiên liệu (lít/100km) - mặc định theo từng loại xe
      let fuelConsumptionPer100km;
      if (vehicleType.capacity <= 5) {
        fuelConsumptionPer100km = 7; // 7 lít/100km cho xe nhỏ
      } else if (vehicleType.capacity <= 8) {
        fuelConsumptionPer100km = 9; // 9 lít/100km cho xe 7 chỗ
      } else {
        fuelConsumptionPer100km = 12; // 12 lít/100km cho xe lớn
      }

      // Giá nhiên liệu (VND/lít) - có thể lấy từ cấu hình hoặc cập nhật theo thời gian thực
      const fuelPrice = await this.getFuelPrice();

      // Tính tổng chi phí nhiên liệu
      const fuelConsumption = (distanceKm / 100) * fuelConsumptionPer100km;
      const fuelCost = fuelConsumption * fuelPrice;

      return Math.round(fuelCost);
    } catch (error) {
      this.logger.error(
        `Lỗi khi tính chi phí nhiên liệu: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      const formattedError = formatError(
        error,
        'Lỗi khi tính chi phí nhiên liệu',
      );
      throw new HttpException(formattedError.message, formattedError.status);
    }
  }

  /**
   * Gọi API Goong Maps để lấy khoảng cách giữa hai địa điểm
   */
  private async getDistanceFromGoongMap(
    origin: string,
    destination: string,
  ): Promise<number> {
    try {
      if (!this.goongApiKey) {
        this.logger.warn(
          'Sử dụng khoảng cách ước tính vì không có GOONG_API_KEY',
        );
        return 10.0; // Giả định khoảng cách 10km cho mục đích kiểm thử
      }

      // Trong triển khai thực tế cần geocode địa chỉ thành tọa độ
      // Tạm thời sử dụng địa chỉ dạng "lat,lng" để đơn giản
      const url = `https://rsapi.goong.io/Direction`;
      const params = {
        origin: origin,
        destination: destination,
        vehicle: 'car',
        api_key: this.goongApiKey,
      };

      const response = await firstValueFrom(
        this.httpService.get<GoongMapDirectionsResponse>(url, { params }),
      );

      // Kiểm tra kỹ lưỡng từng cấp dữ liệu để tránh lỗi undefined
      if (!response || !response.data) {
        this.logger.warn(
          'Không nhận được dữ liệu từ Goong Maps API, sử dụng giá trị mặc định',
        );
        return 10.0;
      }

      if (!response.data.routes || response.data.routes.length === 0) {
        this.logger.warn(
          'Không tìm thấy tuyến đường trong phản hồi của Goong Maps API, sử dụng giá trị mặc định',
        );
        return 10.0;
      }

      const route = response.data.routes[0];
      // Add null check for route
      if (!route) {
        this.logger.warn(
          'Route không tồn tại trong kết quả, sử dụng giá trị mặc định',
        );
        return 10.0;
      }

      // Now route is definitely defined
      if (!route.legs || route.legs.length === 0) {
        this.logger.warn(
          'Không tìm thấy thông tin chặng đường trong tuyến đường, sử dụng giá trị mặc định',
        );
        return 10.0;
      }

      const leg = route.legs[0];
      // Add null check for leg
      if (!leg) {
        this.logger.warn(
          'Leg không tồn tại trong kết quả, sử dụng giá trị mặc định',
        );
        return 10.0;
      }

      // Now leg is definitely defined
      if (!leg.distance || typeof leg.distance.value !== 'number') {
        this.logger.warn(
          'Không tìm thấy thông tin khoảng cách trong chặng đường, sử dụng giá trị mặc định',
        );
        return 10.0;
      }

      // Chuyển đổi từ mét sang km
      const distanceInMeters = leg.distance.value;
      return distanceInMeters / 1000;
    } catch (error) {
      this.logger.error(
        `Lỗi khi gọi Goong Maps API: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      return 10.0; // Giá trị mặc định trong trường hợp lỗi
    }
  }

  /**
   * Tính tổng khoảng cách qua nhiều điểm dừng
   */
  private async calculateMultiPointDistance(
    startAddress: string,
    endAddress: string,
    intermediateStops: string[],
  ): Promise<number> {
    try {
      let totalDistance = 0;
      let currentPoint = startAddress;

      // Tính khoảng cách từ điểm xuất phát đến điểm dừng đầu tiên
      for (const stop of intermediateStops) {
        const segmentDistance = await this.getDistanceFromGoongMap(
          currentPoint,
          stop,
        );
        totalDistance += segmentDistance;
        currentPoint = stop;
      }

      // Tính khoảng cách từ điểm dừng cuối cùng đến điểm đích
      const finalSegmentDistance = await this.getDistanceFromGoongMap(
        currentPoint,
        endAddress,
      );
      totalDistance += finalSegmentDistance;

      return totalDistance;
    } catch (error) {
      this.logger.error(
        `Lỗi khi tính khoảng cách qua nhiều điểm: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      const formattedError = formatError(
        error,
        'Lỗi khi tính khoảng cách qua nhiều điểm',
      );
      throw new HttpException(formattedError.message, formattedError.status);
    }
  }

  /**
   * Lấy đơn giá/km theo loại xe và vùng hoạt động
   */
  private async getUnitPricePerKm(
    vehicleTypeId: string,
    region: string = 'toàn quốc',
  ): Promise<number> {
    try {
      // Tìm đơn giá cụ thể cho loại xe - không sử dụng region vì không có trường này trong schema
      const priceConfig = await this.prisma.vehiclePricePerKm.findFirst({
        where: {
          vehicleTypeId,
          isActive: true,
        },
      });

      if (priceConfig) {
        return Number(priceConfig.pricePerKm);
      }

      // Nếu không tìm thấy cấu hình giá nào, trả về lỗi hoặc giá mặc định
      this.logger.warn(
        `Không tìm thấy cấu hình giá cho loại xe ${vehicleTypeId}`,
      );
      throw new HttpException(
        `Không tìm thấy cấu hình giá cho loại xe đã chọn`,
        HttpStatus.NOT_FOUND,
      );
    } catch (error) {
      this.logger.error(
        `Lỗi khi lấy đơn giá/km: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      const formattedError = formatError(error, 'Lỗi khi lấy đơn giá/km');
      throw new HttpException(formattedError.message, formattedError.status);
    }
  }

  /**
   * Lấy hệ số nhân cho chuyến khứ hồi
   */
  private async getRoundTripFactor(): Promise<number> {
    try {
      const config = await this.prisma.rentalConfig.findUnique({
        where: { key: 'round_trip_factor' },
      });
      return config && config.value ? parseFloat(String(config.value)) : 2.0; // Mặc định là 2.0
    } catch (error) {
      this.logger.error(
        `Lỗi khi lấy hệ số khứ hồi: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      const formattedError = formatError(error, 'Lỗi khi lấy hệ số khứ hồi');
      throw new HttpException(formattedError.message, formattedError.status);
    }
  }

  /**
   * Lấy giá nhiên liệu hiện tại từ cấu hình
   */
  private async getFuelPrice(): Promise<number> {
    try {
      const config = await this.prisma.rentalConfig.findUnique({
        where: { key: 'fuel_price_per_liter' },
      });
      return config && config.value ? parseFloat(String(config.value)) : 20000; // Mặc định 20,000 VNĐ/lít
    } catch (error) {
      this.logger.error(
        `Lỗi khi lấy giá nhiên liệu: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      const formattedError = formatError(error, 'Lỗi khi lấy giá nhiên liệu');
      throw new HttpException(formattedError.message, formattedError.status);
    }
  }

  /**
   * Lưu lịch sử tính giá theo km
   */
  private async logPriceCalculationByKm(data: any): Promise<void> {
    try {
      // Sử dụng rentalPriceLog thay vì rentalPriceByKmLog
      await this.prisma.rentalPriceLog.create({
        data: {
          id: `kmlog_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          vehicleId: data.vehicleId, // Use vehicleId instead
          rentalPrice: data.totalPrice, // Store totalPrice as rentalPrice
          timestamp: new Date(),
        },
      });
    } catch (error) {
      this.logger.error(
        `Lỗi khi lưu log tính giá theo km: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
    }
  }

  /**
   * Tìm ID của bảng giá dựa trên loại xe và vùng
   */
  private async findPriceId(
    vehicleTypeId: string,
    region: string,
  ): Promise<string | null> {
    try {
      const priceConfig = await this.prisma.vehiclePricePerKm.findFirst({
        where: {
          vehicleTypeId,
        },
      });
      return priceConfig ? priceConfig.id : null;
    } catch (error) {
      this.logger.error(
        `Lỗi khi tìm ID bảng giá: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      return null;
    }
  }
}
