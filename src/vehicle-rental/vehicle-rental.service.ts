import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { RentalPriceLogEntity } from './entities/rental-price-log.entity';

// Define interface for price metadata
interface PriceMetadata {
  basePrice: number;
  weekDiscount: number;
  threeToSixDaysDiscount: number;
  driverFee: number;
  insuranceFee: number;
  validFrom?: Date;
  validTo?: Date;
}

// Define interface for additional service
interface AdditionalService {
  id: string;
  name: string;
  description?: string;
  price: number;
  isPerDay: boolean;
  isActive: boolean;
}

@Injectable()
export class VehicleRentalService {
  private readonly logger = new Logger(VehicleRentalService.name);

  constructor(private prisma: PrismaService) {}

  // Tìm tất cả bảng giá với phân trang
  async findAllPrices({
    skip,
    take,
    cursor,
    where,
    orderBy,
    metadataFilter,
  }: {
    skip?: number;
    take?: number;
    cursor?: Prisma.VehicleRentalPriceWhereUniqueInput;
    where?: Prisma.VehicleRentalPriceWhereInput;
    orderBy?: Prisma.VehicleRentalPriceOrderByWithRelationInput;
    metadataFilter?: Record<string, any>;
  }) {
    try {
      // Xử lý metadataFilter cho các điều kiện lọc nâng cao
      if (metadataFilter && Object.keys(metadataFilter).length > 0) {
        // Use type assertion to overcome TypeScript errors for filter properties
        const whereWithFilter = { ...where } as any;

        if (metadataFilter.vehicleType) {
          whereWithFilter.vehicleType = {
            ...whereWithFilter.vehicleType,
            code: metadataFilter.vehicleType, // Lọc theo mã loại xe
          };
        }

        // Xử lý các điều kiện lọc khác nếu cần
        if (metadataFilter.priceRange) {
          const [minPrice, maxPrice] = metadataFilter.priceRange
            .split('-')
            .map(Number);
          whereWithFilter.basePrice = {
            gte: minPrice,
            lte: maxPrice,
          };
        }

        // Xử lý lọc theo số ghế
        if (metadataFilter.minSeats) {
          whereWithFilter.vehicleType = {
            ...whereWithFilter.vehicleType,
            seats: {
              gte: parseInt(metadataFilter.minSeats),
            },
          };
        }

        where = whereWithFilter;
      }

      const prices = await this.prisma.vehicleRentalPrice.findMany({
        skip,
        take,
        cursor,
        where,
        orderBy,
        include: {
          VehicleType: true,
        },
      });

      const total = await this.prisma.vehicleRentalPrice.count({ where });

      return {
        data: prices,
        meta: this.createPaginationMeta(total, skip, take),
      };
    } catch (error) {
      this.logger.error('Lỗi khi lấy danh sách bảng giá', error);
      throw error;
    }
  }

  /**
   * Tìm một bảng giá cụ thể theo id
   */
  async findPriceById(id: string) {
    try {
      const price = await this.prisma.vehicleRentalPrice.findUnique({
        where: { id },
        include: {
          VehicleType: true,
        },
      });

      if (!price) {
        throw new NotFoundException(`Không tìm thấy bảng giá với id: ${id}`);
      }

      return price;
    } catch (error) {
      this.logger.error(`Lỗi khi tìm bảng giá: ${id}`, error);
      throw error;
    }
  }

  /**
   * Tạo mới một bảng giá
   */
  async createPrice(data: Prisma.VehicleRentalPriceCreateInput) {
    try {
      return await this.prisma.vehicleRentalPrice.create({
        data,
        include: {
          VehicleType: true,
        },
      });
    } catch (error) {
      this.logger.error('Lỗi khi tạo mới bảng giá', error);
      throw error;
    }
  }

  /**
   * Cập nhật một bảng giá
   */
  async updatePrice(id: string, data: Prisma.VehicleRentalPriceUpdateInput) {
    try {
      return await this.prisma.vehicleRentalPrice.update({
        where: { id },
        data,
        include: {
          VehicleType: true,
        },
      });
    } catch (error) {
      this.logger.error(`Lỗi khi cập nhật bảng giá: ${id}`, error);
      throw error;
    }
  }

  /**
   * Xóa một bảng giá
   */
  async deletePrice(id: string) {
    try {
      return await this.prisma.vehicleRentalPrice.delete({
        where: { id },
      });
    } catch (error) {
      this.logger.error(`Lỗi khi xóa bảng giá: ${id}`, error);
      throw error;
    }
  }

  /**
   * Lấy tất cả các loại xe
   */
  async findAllVehicleTypes(params: {
    skip?: number;
    take?: number;
    where?: Prisma.VehicleTypeWhereInput;
    orderBy?: Prisma.VehicleTypeOrderByWithRelationInput;
  }) {
    const { skip, take, where, orderBy } = params;
    try {
      const vehicleTypes = await this.prisma.vehicleType.findMany({
        skip,
        take,
        where,
        orderBy,
      });

      const total = await this.prisma.vehicleType.count({ where });

      return {
        data: vehicleTypes,
        meta: this.createPaginationMeta(total, skip, take),
      };
    } catch (error) {
      this.logger.error('Lỗi khi lấy danh sách loại xe', error);
      throw error;
    }
  }

  /**
   * Lấy thông tin chi tiết một loại xe
   */
  async findVehicleTypeById(id: string) {
    try {
      const vehicleType = await this.prisma.vehicleType.findUnique({
        where: { id },
        include: {},
      });

      if (!vehicleType) {
        throw new NotFoundException(`Không tìm thấy loại xe với id: ${id}`);
      }

      return vehicleType;
    } catch (error) {
      this.logger.error(`Lỗi khi tìm loại xe: ${id}`, error);
      throw error;
    }
  }

  /**
   * Tạo mới loại xe
   */
  async createVehicleType(data: Prisma.VehicleTypeCreateInput) {
    try {
      return await this.prisma.vehicleType.create({
        data,
      });
    } catch (error) {
      this.logger.error('Lỗi khi tạo mới loại xe', error);
      throw error;
    }
  }

  /**
   * Cập nhật thông tin loại xe
   */
  async updateVehicleType(id: string, data: Prisma.VehicleTypeUpdateInput) {
    try {
      return await this.prisma.vehicleType.update({
        where: { id },
        data,
      });
    } catch (error) {
      this.logger.error(`Lỗi khi cập nhật loại xe: ${id}`, error);
      throw error;
    }
  }

  /**
   * Xóa loại xe
   */
  async deleteVehicleType(id: string) {
    try {
      return await this.prisma.vehicleType.delete({
        where: { id },
      });
    } catch (error) {
      this.logger.error(`Lỗi khi xóa loại xe: ${id}`, error);
      throw error;
    }
  }

  /**
   * Lấy tất cả các tuyến đường
   */
  async findAllRoutes(params: {
    skip?: number;
    take?: number;
    where?: Prisma.RouteWhereInput;
    orderBy?: Prisma.RouteOrderByWithRelationInput;
  }) {
    const { skip, take, where, orderBy } = params;
    try {
      const routes = await this.prisma.route.findMany({
        skip,
        take,
        where,
        orderBy,
      });

      const total = await this.prisma.route.count({ where });

      return {
        data: routes,
        meta: this.createPaginationMeta(total, skip, take),
      };
    } catch (error) {
      this.logger.error('Lỗi khi lấy danh sách tuyến đường', error);
      throw error;
    }
  }

  /**
   * Lấy thông tin chi tiết một tuyến đường
   */
  async findRouteById(id: string) {
    try {
      const route = await this.prisma.route.findUnique({
        where: { id },
      });

      if (!route) {
        throw new NotFoundException(`Không tìm thấy tuyến đường với id: ${id}`);
      }

      return route;
    } catch (error) {
      this.logger.error(`Lỗi khi tìm tuyến đường: ${id}`, error);
      throw error;
    }
  }

  /**
   * Tạo mới tuyến đường
   */
  async createRoute(data: Prisma.RouteCreateInput) {
    try {
      return await this.prisma.route.create({
        data,
      });
    } catch (error) {
      this.logger.error('Lỗi khi tạo mới tuyến đường', error);
      throw error;
    }
  }

  /**
   * Cập nhật thông tin tuyến đường
   */
  async updateRoute(id: string, data: Prisma.RouteUpdateInput) {
    try {
      return await this.prisma.route.update({
        where: { id },
        data,
      });
    } catch (error) {
      this.logger.error(`Lỗi khi cập nhật tuyến đường: ${id}`, error);
      throw error;
    }
  }

  /**
   * Xóa tuyến đường
   */
  async deleteRoute(id: string) {
    try {
      return await this.prisma.route.delete({
        where: { id },
      });
    } catch (error) {
      this.logger.error(`Lỗi khi xóa tuyến đường: ${id}`, error);
      throw error;
    }
  }

  /**
   * Quản lý cấu hình hệ thống
   */
  async getConfig(key: string) {
    try {
      const config = await this.prisma.rentalConfig.findUnique({
        where: { key },
      });
      return config;
    } catch (error) {
      this.logger.error(`Lỗi khi lấy cấu hình: ${key}`, error);
      throw error;
    }
  }

  async setConfig(key: string, value: string) {
    try {
      return await this.prisma.rentalConfig.upsert({
        where: { key },
        update: {
          value,
        },
        create: {
          id: `config_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          key,
          value,
          updatedAt: new Date(),
          createdAt: new Date(),
        },
      });
    } catch (error) {
      this.logger.error(`Lỗi khi thiết lập cấu hình: ${key}`, error);
      throw error;
    }
  }

  /**
   * Lấy lịch sử tính giá
   */
  async getPriceCalculationLogs(params: {
    skip?: number;
    take?: number;
    where?: Prisma.RentalPriceLogWhereInput;
    orderBy?: Prisma.RentalPriceLogOrderByWithRelationInput;
  }) {
    const { skip, take, where, orderBy } = params;
    try {
      const logs = await this.prisma.$queryRaw`
        SELECT * FROM "RentalPriceLog"
        WHERE ${where ? JSON.stringify(where) : 'true'}
        ${orderBy ? `ORDER BY ${JSON.stringify(orderBy)}` : 'ORDER BY "createdAt" DESC'}
        ${take ? `LIMIT ${take}` : ''}
        ${skip ? `OFFSET ${skip}` : ''}
      `;

      const total = await this.prisma.$queryRaw`
        SELECT COUNT(*) FROM "RentalPriceLog"
        WHERE ${where ? JSON.stringify(where) : 'true'}
      `;

      const totalCount = parseInt((total as any[])[0]?.count || '0', 10);

      return {
        data: (logs as any[]).map((log: any) =>
          RentalPriceLogEntity.fromPrisma(log),
        ),
        meta: {
          total: totalCount,
          page: skip ? Math.floor(skip / (take || 10)) + 1 : 1,
          pageSize: take || 10,
          pageCount: Math.ceil(totalCount / (take || 10)),
        },
      };
    } catch (error) {
      console.error('Error getting rental price logs:', error);
      return {
        data: [],
        meta: {
          total: 0,
          page: 1,
          pageSize: take || 10,
          pageCount: 0,
        },
      };
    }
  }

  /**
   * Lấy lịch sử tính giá theo km
   */
  async getKmPriceCalculationLogs(params: {
    skip?: number;
    take?: number;
    where?: Prisma.RentalPriceLogWhereInput;
    orderBy?: Prisma.RentalPriceLogOrderByWithRelationInput;
  }) {
    const { skip, take, where, orderBy } = params;
    try {
      const logs = await this.prisma.rentalPriceLog.findMany({
        skip,
        take,
        where,
        orderBy: orderBy || { id: 'desc' },
      });

      const total = await this.prisma.rentalPriceLog.count({ where });

      return {
        data: logs,
        meta: this.createPaginationMeta(total, skip, take),
      };
    } catch (error) {
      this.logger.error('Lỗi khi lấy lịch sử tính giá theo km', error);
      throw error;
    }
  }

  /**
   * Lấy danh sách tất cả đơn giá theo km
   */
  async findAllKmPrices(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.VehiclePricePerKmWhereUniqueInput;
    where?: Prisma.VehiclePricePerKmWhereInput;
    orderBy?: Prisma.VehiclePricePerKmOrderByWithRelationInput;
  }) {
    const { skip, take, cursor, where, orderBy } = params;
    try {
      const prices = await this.prisma.vehiclePricePerKm.findMany({
        skip,
        take,
        cursor,
        where,
        orderBy,
        include: {
          VehicleType: true,
        },
      });

      const total = await this.prisma.vehiclePricePerKm.count({ where });

      return {
        data: prices,
        meta: this.createPaginationMeta(total, skip, take),
      };
    } catch (error) {
      this.logger.error('Lỗi khi lấy danh sách đơn giá theo km', error);
      throw error;
    }
  }

  /**
   * Tìm một đơn giá theo km cụ thể theo id
   */
  async findKmPriceById(id: string) {
    try {
      const price = await this.prisma.vehiclePricePerKm.findUnique({
        where: { id },
        include: {
          VehicleType: true,
        },
      });

      if (!price) {
        throw new NotFoundException(
          `Không tìm thấy đơn giá theo km với id: ${id}`,
        );
      }

      return price;
    } catch (error) {
      this.logger.error(`Lỗi khi tìm đơn giá theo km: ${id}`, error);
      throw error;
    }
  }

  /**
   * Tạo mới đơn giá theo km
   */
  async createKmPrice(data: Prisma.VehiclePricePerKmCreateInput) {
    try {
      return await this.prisma.vehiclePricePerKm.create({
        data,
        include: {
          VehicleType: true,
        },
      });
    } catch (error) {
      this.logger.error('Lỗi khi tạo mới đơn giá theo km', error);
      throw error;
    }
  }

  /**
   * Cập nhật đơn giá theo km
   */
  async updateKmPrice(id: string, data: Prisma.VehiclePricePerKmUpdateInput) {
    try {
      return await this.prisma.vehiclePricePerKm.update({
        where: { id },
        data,
        include: {
          VehicleType: true,
        },
      });
    } catch (error) {
      this.logger.error(`Lỗi khi cập nhật đơn giá theo km: ${id}`, error);
      throw error;
    }
  }

  /**
   * Xóa đơn giá theo km
   */
  async deleteKmPrice(id: string) {
    try {
      return await this.prisma.vehiclePricePerKm.delete({
        where: { id },
      });
    } catch (error) {
      this.logger.error(`Lỗi khi xóa đơn giá theo km: ${id}`, error);
      throw error;
    }
  }

  /**
   * Tính giá thuê xe dựa trên thời gian, loại xe và các tùy chọn
   */
  async calculateRentalPrice(params: {
    vehicleTypeId: string;
    startDate: Date;
    endDate: Date;
    options?: {
      withDriver?: boolean;
      includeInsurance?: boolean;
      additionalServices?: string[];
    };
  }) {
    const { vehicleTypeId, startDate, endDate, options } = params;

    try {
      // Lấy bảng giá hiện hành cho loại xe
      const currentPrice = await this.prisma.vehicleRentalPrice.findFirst({
        where: {
          vehicleTypeId,
          isActive: true,
          // Use type assertion to fix the TypeScript error with validFrom
          ...({
            validFrom: {
              lte: new Date(),
            },
            validTo: {
              gte: new Date(),
            },
          } as unknown as Prisma.VehicleRentalPriceWhereInput),
        },
        include: {
          VehicleType: true,
        },
      });

      if (!currentPrice) {
        throw new NotFoundException(
          `Không tìm thấy bảng giá cho loại xe: ${vehicleTypeId}`,
        );
      }

      // Extract metadata from currentPrice.metadata
      const priceMetadata = currentPrice.metadata
        ? typeof currentPrice.metadata === 'object'
          ? currentPrice.metadata
          : JSON.parse(String(currentPrice.metadata))
        : {};

      // Create metadata object with defaults from priceMetadata or fall back to properties
      const metadata: PriceMetadata = {
        basePrice:
          priceMetadata.basePrice || currentPrice.pricePerDay?.toNumber() || 0,
        weekDiscount: priceMetadata.weekDiscount || 0,
        threeToSixDaysDiscount: priceMetadata.threeToSixDaysDiscount || 0,
        driverFee: priceMetadata.driverFee || 0,
        insuranceFee: priceMetadata.insuranceFee || 0,
        validFrom: priceMetadata.validFrom || currentPrice.createdAt,
        validTo:
          priceMetadata.validTo ||
          new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      };

      // Tính số ngày thuê
      const rentalDays = Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (rentalDays <= 0) {
        throw new Error('Thời gian thuê không hợp lệ');
      }

      // Giá cơ bản
      let totalPrice = metadata.basePrice * rentalDays;

      // Áp dụng giảm giá theo số ngày thuê (nếu có)
      if (rentalDays >= 7) {
        totalPrice = totalPrice * (1 - metadata.weekDiscount / 100);
      } else if (rentalDays >= 3) {
        totalPrice = totalPrice * (1 - metadata.threeToSixDaysDiscount / 100);
      }

      // Thêm phí tài xế nếu cần
      if (options?.withDriver) {
        totalPrice += metadata.driverFee * rentalDays;
      }

      // Thêm phí bảo hiểm nếu cần
      if (options?.includeInsurance) {
        totalPrice += metadata.insuranceFee * rentalDays;
      }

      // Thêm phí dịch vụ bổ sung nếu có
      if (options?.additionalServices?.length) {
        const additionalServicesPrice =
          await this.calculateAdditionalServicesPrice(
            options.additionalServices,
            rentalDays,
          );
        totalPrice += additionalServicesPrice;
      }

      return {
        basePrice: metadata.basePrice,
        rentalDays,
        totalPrice,
        breakdown: {
          baseCharge: metadata.basePrice * rentalDays,
          discounts:
            rentalDays >= 7
              ? (metadata.basePrice * rentalDays * metadata.weekDiscount) / 100
              : rentalDays >= 3
                ? (metadata.basePrice *
                    rentalDays *
                    metadata.threeToSixDaysDiscount) /
                  100
                : 0,
          driverFee: options?.withDriver ? metadata.driverFee * rentalDays : 0,
          insuranceFee: options?.includeInsurance
            ? metadata.insuranceFee * rentalDays
            : 0,
          additionalServicesFee: options?.additionalServices?.length
            ? await this.calculateAdditionalServicesPrice(
                options.additionalServices,
                rentalDays,
              )
            : 0,
        },
      };
    } catch (error) {
      this.logger.error('Lỗi khi tính giá thuê xe', error);
      throw error;
    }
  }

  /**
   * Tính giá dịch vụ bổ sung
   */
  private async calculateAdditionalServicesPrice(
    serviceIds: string[],
    rentalDays: number,
  ): Promise<number> {
    try {
      // Using type assertion to access additionalService model
      const services = await (this.prisma as any).additionalService.findMany({
        where: {
          id: {
            in: serviceIds,
          },
          isActive: true,
        },
      });

      return services.reduce((total: number, service: AdditionalService) => {
        if (service.isPerDay) {
          return total + service.price * rentalDays;
        }
        return total + service.price;
      }, 0);
    } catch (error) {
      this.logger.error('Lỗi khi tính giá dịch vụ bổ sung', error);
      return 0;
    }
  }

  /**
   * Tạo metadata cho phân trang
   */
  private createPaginationMeta(total: number, skip?: number, take?: number) {
    const limit = take || 10;
    const page = skip ? Math.floor(skip / limit) + 1 : 1;
    const pages = Math.ceil(total / limit);

    return {
      total,
      page,
      limit,
      pages,
    };
  }
}
