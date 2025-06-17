import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServiceEntity } from './entities/service.entity';
import { ServiceType } from '@prisma/client';
import { PaginationOptionsDto } from '../common/dto/pagination-options.dto';
import { ServiceFilterDto } from './dto/service-filter.dto';
import { AdvancedServiceFilterDto } from './dto/advanced-service-filter.dto';
import { CACHE_TTL } from '../common/constants/cache.constants';
import { RedisService } from '../redis/redis.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import { ServiceFilterInput } from './dto/service-filter.input';
import { Prisma } from '@prisma/client';
import { ErrorCodes } from '../common/constants/error-codes';
import { ValidationException } from '../common/exceptions/business.exception';
import * as crypto from 'crypto';
import {
  UpdateMultilingualServiceDetailDto,
  MultilingualText,
  MultilingualArray,
} from './dto/multilingual-service-detail.dto';
import { PaginationService } from '../common/services/pagination.service';
import { StandardPaginationDto } from '../common/dto/standard-pagination.dto';
import { PaginationResult } from '../common/interfaces/pagination.interface';

@Injectable()
export class ServicesService {
  private readonly logger = new Logger(ServicesService.name);
  private readonly CACHE_KEY_PREFIX = 'service';

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly paginationService: PaginationService,
  ) {}

  async create(
    createServiceDto: CreateServiceDto,
    userId: string,
  ): Promise<ServiceEntity> {
    try {
      this.logger.log(`Creating service: ${createServiceDto.name}`);

      // Prepare metadata to include additional fields not in main schema
      const metadata = {
        ...(createServiceDto.metadata || {}),
        ...(createServiceDto.imageUrl && {
          imageUrl: createServiceDto.imageUrl,
        }),
        ...(createServiceDto.duration !== undefined && {
          duration: createServiceDto.duration,
        }),
        ...(createServiceDto.durationUnit && {
          durationUnit: createServiceDto.durationUnit,
        }),
        ...(createServiceDto.highlights && {
          highlights: createServiceDto.highlights,
        }),
        ...(createServiceDto.tags && { tags: createServiceDto.tags }),
        ...(createServiceDto.price !== undefined && {
          price: createServiceDto.price,
        }),
        ...(createServiceDto.currency && {
          currency: createServiceDto.currency,
        }),
      };

      const serviceData: Prisma.ServiceCreateInput = {
        id: crypto.randomUUID(), // Generate unique ID
        name: createServiceDto.name,
        type: createServiceDto.type,
        description: createServiceDto.description || '',
        isActive: createServiceDto.isActive ?? true,
        metadata: metadata,
        updatedAt: new Date(),
        ...(createServiceDto.audioFileMaleId && {
          audioFileMaleId: createServiceDto.audioFileMaleId,
        }),
        ...(createServiceDto.audioFileFemaleId && {
          audioFileFemaleId: createServiceDto.audioFileFemaleId,
        }),
      };

      const service = await this.prisma.service.create({
        data: serviceData,
      });

      // Tự động tạo service detail tương ứng
      await this.createServiceDetail(
        service.id,
        service.type,
        createServiceDto,
      );

      this.logger.log(`Service created successfully: ${service.id}`);
      const serviceEntity = ServiceEntity.fromPrisma(service);

      await this.clearCache(service.id);
      return serviceEntity;
    } catch (error: unknown) {
      this.logger.error(
        `Failed to create service: ${createServiceDto.name}`,
        error instanceof Error ? error.stack : 'Unknown error',
      );

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ValidationException(ErrorCodes.SERVICE_ALREADY_EXISTS, {
            field: error.meta?.target,
          });
        }
      }
      throw error;
    }
  }

  // Phương thức tự động tạo service detail
  private async createServiceDetail(
    serviceId: string,
    serviceType: ServiceType,
    createServiceDto: CreateServiceDto,
  ): Promise<void> {
    try {
      const detailData = createServiceDto.metadata || {};

      switch (serviceType) {
        case ServiceType.VEHICLE:
          await this.createVehicleDetail(
            serviceId,
            detailData,
            createServiceDto,
          );
          break;
        case ServiceType.HOTEL:
          await this.createHotelDetail(serviceId, detailData, createServiceDto);
          break;
        case ServiceType.TOUR:
          await this.createTourDetail(serviceId, detailData, createServiceDto);
          break;
        case ServiceType.FLIGHT:
          await this.createFlightDetail(
            serviceId,
            detailData,
            createServiceDto,
          );
          break;
        case ServiceType.TRANSFER:
          await this.createTransferDetail(
            serviceId,
            detailData,
            createServiceDto,
          );
          break;
        case ServiceType.VISA:
          await this.createVisaDetail(serviceId, detailData, createServiceDto);
          break;
        case ServiceType.INSURANCE:
          await this.createInsuranceDetail(
            serviceId,
            detailData,
            createServiceDto,
          );
          break;
        case ServiceType.FAST_TRACK:
          await this.createFastTrackDetail(
            serviceId,
            detailData,
            createServiceDto,
          );
          break;
        default:
          this.logger.warn(
            `No detail creation logic for service type: ${serviceType}`,
          );
      }

      this.logger.log(
        `Service detail created for ${serviceType}: ${serviceId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to create service detail for ${serviceId}:`,
        error,
      );
    }
  }

  private async createVehicleDetail(
    serviceId: string,
    detailData: any,
    serviceDto: CreateServiceDto,
  ) {
    const vehicleDetails = detailData.vehicleDetails || {};

    await this.prisma.vehicleServiceDetail.create({
      data: {
        id: crypto.randomUUID(),
        serviceId,
        vehicleType: vehicleDetails.vehicleType || 'Sedan',
        brand: vehicleDetails.brand || 'Toyota',
        model: vehicleDetails.model || 'Camry',
        seats: vehicleDetails.seats || 5,
        fuelType: vehicleDetails.fuelType || 'Petrol',
        pricePerDay: vehicleDetails.pricePerDay || serviceDto.price || 1500000,
        pickupLocation: vehicleDetails.pickupLocation || 'Hanoi',
        dropoffLocation: vehicleDetails.dropoffLocation || 'Hanoi',
        description: `${vehicleDetails.brand || 'Premium'} ${vehicleDetails.model || 'Vehicle'} rental service`,
        extras: vehicleDetails.extras || {
          airConditioning: true,
          gps: true,
          insurance: true,
          driverAvailable: false,
        },
      },
    });
  }

  private async createHotelDetail(
    serviceId: string,
    detailData: any,
    serviceDto: CreateServiceDto,
  ) {
    const hotelDetails = detailData.hotelDetails || {};

    await this.prisma.hotelServiceDetail.create({
      data: {
        id: crypto.randomUUID(),
        serviceId,
        hotelName: hotelDetails.hotelName || serviceDto.name,
        starRating: hotelDetails.starRating || 3,
        roomType: hotelDetails.roomType || 'Standard Room',
        boardType: hotelDetails.boardType || 'Room Only',
        basePrice: hotelDetails.basePrice || serviceDto.price || 2000000,
        taxPercent: hotelDetails.taxPercent || 10,
        amenities: hotelDetails.amenities || ['WiFi', 'Air Conditioning'],
        address: hotelDetails.address || 'Hanoi, Vietnam',
        city: hotelDetails.city || 'Hanoi',
        country: hotelDetails.country || 'Vietnam',
        checkInTime: hotelDetails.checkInTime || '14:00',
        checkOutTime: hotelDetails.checkOutTime || '12:00',
        description:
          hotelDetails.description ||
          `Comfortable accommodation at ${serviceDto.name}`,
      },
    });
  }

  private async createTourDetail(
    serviceId: string,
    detailData: any,
    serviceDto: CreateServiceDto,
  ) {
    const tourDetails = detailData.tourDetails || {};

    await this.prisma.tourServiceDetail.create({
      data: {
        id: crypto.randomUUID(),
        serviceId,
        tourCode: tourDetails.tourCode || `TOUR${Date.now()}`,
        itinerary: tourDetails.itinerary || {
          day1: 'Departure and sightseeing',
          day2: 'Return journey',
        },
        departureDates: tourDetails.departureDates || [
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 tuần sau
          new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 tuần sau
        ],
        adultPrice: tourDetails.adultPrice || serviceDto.price || 2500000,
        childPrice:
          tourDetails.childPrice ||
          (serviceDto.price ? serviceDto.price * 0.7 : 1750000),
        seatsAvailable: tourDetails.seatsAvailable || 10,
        minPax: tourDetails.minPax || 2,
        maxPax: tourDetails.maxPax || 10,
        durationInDays: tourDetails.durationInDays || serviceDto.duration || 2,
        description:
          tourDetails.description ||
          `Exciting tour experience: ${serviceDto.name}`,
      },
    });
  }

  private async createFlightDetail(
    serviceId: string,
    detailData: any,
    serviceDto: CreateServiceDto,
  ) {
    const flightDetails = detailData.flightDetails || {};

    await this.prisma.flightServiceDetail.create({
      data: {
        id: crypto.randomUUID(),
        serviceId,
        airline: flightDetails.airline || 'Vietnam Airlines',
        flightNumber:
          flightDetails.flightNumber || `VN${Math.floor(Math.random() * 1000)}`,
        depAirportCode: flightDetails.depAirportCode || 'HAN',
        arrAirportCode: flightDetails.arrAirportCode || 'SGN',
        depTime: flightDetails.depTime || new Date(),
        arrTime:
          flightDetails.arrTime || new Date(Date.now() + 2 * 60 * 60 * 1000),
        fareClass: flightDetails.fareClass || 'Economy',
        basePrice: flightDetails.basePrice || serviceDto.price || 2000000,
        description:
          flightDetails.description || `Flight service: ${serviceDto.name}`,
      },
    });
  }

  private async createTransferDetail(
    serviceId: string,
    detailData: any,
    serviceDto: CreateServiceDto,
  ) {
    const transferDetails = detailData.transferDetails || {};

    await this.prisma.transferServiceDetail.create({
      data: {
        id: crypto.randomUUID(),
        serviceId,
        vehicleType: transferDetails.vehicleType || 'Sedan',
        fromLocation: transferDetails.fromLocation || 'Airport',
        toLocation: transferDetails.toLocation || 'City Center',
        basePrice: transferDetails.basePrice || serviceDto.price || 500000,
        maxPassengers: transferDetails.maxPassengers || 4,
        description:
          transferDetails.description || `Transfer service: ${serviceDto.name}`,
      },
    });
  }

  private async createVisaDetail(
    serviceId: string,
    detailData: any,
    serviceDto: CreateServiceDto,
  ) {
    const visaDetails = detailData.visaDetails || {};

    await this.prisma.visaServiceDetail.create({
      data: {
        id: crypto.randomUUID(),
        serviceId,
        visaType: visaDetails.visaType || 'Tourist',
        targetCountry: visaDetails.targetCountry || 'Vietnam',
        serviceLevel: visaDetails.serviceLevel || 'Standard',
        processingFee: visaDetails.processingFee || serviceDto.price || 800000,
        serviceCharge: visaDetails.serviceCharge || 100000,
        description:
          visaDetails.description || `Visa service: ${serviceDto.name}`,
      },
    });
  }

  private async createInsuranceDetail(
    serviceId: string,
    detailData: any,
    serviceDto: CreateServiceDto,
  ) {
    const insuranceDetails = detailData.insuranceDetails || {};

    await this.prisma.insuranceServiceDetail.create({
      data: {
        id: crypto.randomUUID(),
        serviceId,
        insurer: insuranceDetails.insurer || 'Bao Viet Insurance',
        planCode: insuranceDetails.planCode || 'TRAVEL_BASIC',
        coverageDetails: insuranceDetails.coverageDetails || {
          medicalExpenses: 50000000,
          accidentCoverage: 100000000,
          tripCancellation: true,
        },
        premiumAmount:
          insuranceDetails.premiumAmount || serviceDto.price || 300000,
        description:
          insuranceDetails.description ||
          `Insurance service: ${serviceDto.name}`,
      },
    });
  }

  private async createFastTrackDetail(
    serviceId: string,
    detailData: any,
    serviceDto: CreateServiceDto,
  ) {
    const fastTrackDetails = detailData.fastTrackDetails || {};

    await this.prisma.fastTrackServiceDetail.create({
      data: {
        id: crypto.randomUUID(),
        serviceId,
        airportCode: fastTrackDetails.airportCode || 'HAN',
        serviceLevel: fastTrackDetails.serviceLevel || 'Standard',
        basePrice: fastTrackDetails.basePrice || serviceDto.price || 800000,
        description:
          fastTrackDetails.description ||
          `Fast track service: ${serviceDto.name}`,
      },
    });
  }

  // Phương thức để lấy service kèm theo detail
  async findOneWithDetails(
    id: string,
  ): Promise<ServiceEntity & { details?: any }> {
    try {
      const service = await this.findOne(id);
      const details = await this.getServiceDetails(id, service.type);

      return {
        ...service,
        details,
      };
    } catch (error: unknown) {
      this.logger.error(
        `Failed to find service with details: ${id}`,
        error instanceof Error ? error.stack : 'Unknown error',
      );
      throw error;
    }
  }

  private async getServiceDetails(
    serviceId: string,
    serviceType: ServiceType,
  ): Promise<any> {
    try {
      switch (serviceType) {
        case ServiceType.VEHICLE:
          return await this.prisma.vehicleServiceDetail.findUnique({
            where: { serviceId },
          });
        case ServiceType.HOTEL:
          return await this.prisma.hotelServiceDetail.findUnique({
            where: { serviceId },
          });
        case ServiceType.TOUR:
          return await this.prisma.tourServiceDetail.findUnique({
            where: { serviceId },
          });
        case ServiceType.FLIGHT:
          return await this.prisma.flightServiceDetail.findUnique({
            where: { serviceId },
          });
        case ServiceType.TRANSFER:
          return await this.prisma.transferServiceDetail.findUnique({
            where: { serviceId },
          });
        case ServiceType.VISA:
          return await this.prisma.visaServiceDetail.findUnique({
            where: { serviceId },
          });
        case ServiceType.INSURANCE:
          return await this.prisma.insuranceServiceDetail.findUnique({
            where: { serviceId },
          });
        case ServiceType.FAST_TRACK:
          return await this.prisma.fastTrackServiceDetail.findUnique({
            where: { serviceId },
          });
        default:
          return null;
      }
    } catch (error) {
      this.logger.error(
        `Failed to get details for service ${serviceId}:`,
        error,
      );
      return null;
    }
  }

  async findAll(
    options: PaginationOptionsDto & ServiceFilterDto,
  ): Promise<{ data: ServiceEntity[]; metadata: any }> {
    try {
      const {
        page = 1,
        limit = 10,
        type,
        isActive,
        search,
        minPrice,
        maxPrice,
        tags,
      } = options;

      const skip = (page - 1) * limit;

      const where: Prisma.ServiceWhereInput = {
        ...(type && { type }),
        ...(isActive !== undefined && { isActive }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        }),
        // Note: Price filtering would need to be done via service details
        ...(tags && tags.length > 0 && { tags: { hasSome: tags } }),
      };

      const [services, total] = await Promise.all([
        this.prisma.service.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.service.count({ where }),
      ]);

      return {
        data: services.map(ServiceEntity.fromPrisma),
        metadata: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error: unknown) {
      this.logger.error(
        'Failed to find services',
        error instanceof Error ? error.stack : 'Unknown error',
      );
      throw error;
    }
  }

  async findOne(id: string): Promise<ServiceEntity> {
    try {
      const cacheKey = `${this.CACHE_KEY_PREFIX}:${id}`;

      const cached = await this.redisService.getJson<ServiceEntity>(cacheKey);
      if (cached) {
        this.logger.debug(`Service found in cache: ${id}`);
        return cached;
      }

      const service = await this.prisma.service.findUnique({
        where: { id },
      });

      if (!service) {
        throw new NotFoundException(`Service with ID ${id} not found`);
      }

      const serviceEntity = ServiceEntity.fromPrisma(service);
      await this.redisService.setJson(
        cacheKey,
        serviceEntity,
        CACHE_TTL.MEDIUM,
      );

      return serviceEntity;
    } catch (error: unknown) {
      this.logger.error(
        `Failed to find service: ${id}`,
        error instanceof Error ? error.stack : 'Unknown error',
      );
      throw error;
    }
  }

  async update(
    id: string,
    updateServiceDto: UpdateServiceDto,
    userId: string,
  ): Promise<ServiceEntity> {
    try {
      this.logger.log(`Updating service: ${id} by user: ${userId}`);

      const existingService = await this.prisma.service.findUnique({
        where: { id },
      });

      if (!existingService) {
        throw new NotFoundException(`Service with ID ${id} not found`);
      }

      // Handle metadata updates including all additional fields
      const existingMetadata = (existingService.metadata as any) || {};
      const newMetadata = {
        ...existingMetadata,
        ...(updateServiceDto.metadata || {}),
        ...(updateServiceDto.imageUrl !== undefined && {
          imageUrl: updateServiceDto.imageUrl,
        }),
        ...(updateServiceDto.duration !== undefined && {
          duration: updateServiceDto.duration,
        }),
        ...(updateServiceDto.durationUnit && {
          durationUnit: updateServiceDto.durationUnit,
        }),
        ...(updateServiceDto.highlights && {
          highlights: updateServiceDto.highlights,
        }),
        ...(updateServiceDto.tags && { tags: updateServiceDto.tags }),
        ...(updateServiceDto.price !== undefined && {
          price: updateServiceDto.price,
        }),
        ...(updateServiceDto.currency && {
          currency: updateServiceDto.currency,
        }),
      };

      const updateData: Prisma.ServiceUpdateInput = {
        ...(updateServiceDto.name && { name: updateServiceDto.name }),
        ...(updateServiceDto.type && { type: updateServiceDto.type }),
        ...(updateServiceDto.description !== undefined && {
          description: updateServiceDto.description,
        }),
        ...(updateServiceDto.isActive !== undefined && {
          isActive: updateServiceDto.isActive,
        }),
        ...(updateServiceDto.audioFileMaleId !== undefined && {
          audioFileMaleId: updateServiceDto.audioFileMaleId,
        }),
        ...(updateServiceDto.audioFileFemaleId !== undefined && {
          audioFileFemaleId: updateServiceDto.audioFileFemaleId,
        }),
        metadata: newMetadata,
        updatedAt: new Date(),
      };

      const updatedService = await this.prisma.service.update({
        where: { id },
        data: updateData,
      });

      this.logger.log(`Service updated successfully: ${id}`);
      const serviceEntity = ServiceEntity.fromPrisma(updatedService);

      await this.clearCache(id);
      return serviceEntity;
    } catch (error: unknown) {
      this.logger.error(
        `Failed to update service: ${id}`,
        error instanceof Error ? error.stack : 'Unknown error',
      );

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ValidationException(ErrorCodes.SERVICE_ALREADY_EXISTS, {
            field: error.meta?.target,
          });
        }
      }

      throw error;
    }
  }

  async remove(id: string, userId: string): Promise<ServiceEntity> {
    try {
      this.logger.log(`Removing service: ${id} by user: ${userId}`);

      const existingService = await this.prisma.service.findUnique({
        where: { id },
      });

      if (!existingService) {
        throw new NotFoundException(`Service with ID ${id} not found`);
      }

      // TODO: Fix booking count when proper schema relation is available
      const bookingCount = 0; // await this.prisma.booking.count({
      //   where: {
      //     BookingServices: {
      //       some: {
      //         serviceId: id,
      //       },
      //     },
      //   },
      // });

      if (bookingCount > 0) {
        const updatedService = await this.prisma.service.update({
          where: { id },
          data: { isActive: false, updatedAt: new Date() },
        });

        this.logger.log(`Service soft deleted (marked inactive): ${id}`);
        return ServiceEntity.fromPrisma(updatedService);
      }

      const deletedService = await this.prisma.service.delete({
        where: { id },
      });

      this.logger.log(`Service hard deleted: ${id}`);
      await this.clearCache(id);

      return ServiceEntity.fromPrisma(deletedService);
    } catch (error: unknown) {
      this.logger.error(
        `Failed to remove service: ${id}`,
        error instanceof Error ? error.stack : 'Unknown error',
      );
      throw error;
    }
  }

  async findAllWithPagination(
    paginationDto: PaginationDto,
    filters: ServiceFilterInput,
  ): Promise<{
    data: ServiceEntity[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters.type) where.type = filters.type;
    if (filters.isActive !== undefined) where.isActive = filters.isActive;
    if (filters.name)
      where.name = { contains: filters.name, mode: 'insensitive' };

    const [data, total] = await Promise.all([
      this.prisma.service.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.service.count({ where }),
    ]);

    return {
      data: data.map(ServiceEntity.fromPrisma),
      total,
      page,
      limit,
    };
  }

  async generateServiceAudio(
    serviceId: string,
    lang: string,
    userId?: string,
  ): Promise<void> {
    this.logger.log(
      `Generating audio for service ${serviceId} in ${lang}` +
        (userId ? ` by user ${userId}` : ''),
    );
  }

  async createAsEntity(
    createServiceDto: CreateServiceDto,
    userId: string,
  ): Promise<ServiceEntity> {
    return this.create(createServiceDto, userId);
  }

  async updateAsEntity(
    id: string,
    updateServiceDto: UpdateServiceDto,
    userId: string,
  ): Promise<ServiceEntity> {
    return this.update(id, updateServiceDto, userId);
  }

  async findAllAsEntities(type?: ServiceType): Promise<ServiceEntity[]> {
    const result = await this.findAll({ type });
    return result.data;
  }

  async findOneAsEntity(id: string): Promise<ServiceEntity> {
    return this.findOne(id);
  }

  async removeAsEntity(id: string, userId: string): Promise<ServiceEntity> {
    return this.remove(id, userId);
  }

  async getServiceAudio(serviceId: string): Promise<string | null> {
    try {
      const service = await this.findOne(serviceId);
      const metadata = service.metadata as any;
      return metadata?.audioUrl || null;
    } catch (error) {
      this.logger.error(`Failed to get service audio: ${serviceId}`, error);
      return null;
    }
  }

  async generateAudioForAllServices(
    lang: string,
    userId?: string,
  ): Promise<void> {
    this.logger.log(`Generating audio for all services in ${lang}`);
    const services = await this.findAllAsEntities();

    for (const service of services) {
      await this.generateServiceAudio(service.id, lang, userId);
    }
  }

  async toggleActive(id: string): Promise<ServiceEntity> {
    const service = await this.findOne(id);
    return this.update(id, { isActive: !service.isActive }, 'system');
  }

  async findAllByType(type: ServiceType) {
    return this.findAll({ type });
  }

  async getServiceStats(): Promise<{
    totalServices: number;
    activeServices: number;
    totalBookings: number;
    averagePrice: number;
  }> {
    try {
      const [totalServices, activeServices] = await Promise.all([
        this.prisma.service.count(),
        this.prisma.service.count({ where: { isActive: true } }),
      ]);

      const totalBookings = 0;

      // For now, return 0 for average price since price is stored in service details
      // This would need to be calculated from the appropriate service detail tables
      const averagePrice = 0;

      return {
        totalServices,
        activeServices,
        totalBookings,
        averagePrice,
      };
    } catch (error: unknown) {
      this.logger.error(
        'Failed to get service stats',
        error instanceof Error ? error.stack : 'Unknown error',
      );
      throw error;
    }
  }

  // ==========================================
  // I18N + SEO ENHANCED METHODS
  // ==========================================

  async findOneLocalized(
    id: string,
    language: string = 'vi',
  ): Promise<ServiceEntity> {
    const service = await this.findOne(id);
    return this.localizeService(service, language);
  }

  async findAllLocalized(
    language: string = 'vi',
    pagination: any = {},
    filters: any = {},
  ): Promise<{ data: ServiceEntity[]; metadata: any }> {
    const result = await this.findAll({ ...pagination, ...filters });

    return {
      ...result,
      data: result.data.map((service) =>
        this.localizeService(service, language),
      ),
    };
  }

  async updateTranslations(
    id: string,
    translations: any,
    userId: string,
  ): Promise<ServiceEntity> {
    const currentService = await this.prisma.service.findUnique({
      where: { id },
    });
    if (!currentService) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }

    const metadata = (currentService.metadata as any) || {};
    metadata.translations = translations;
    metadata.lastUpdated = new Date();
    metadata.version = (metadata.version || 0) + 1;

    const updatedService = await this.prisma.service.update({
      where: { id },
      data: {
        metadata,
        updatedAt: new Date(),
      },
    });

    await this.clearCache(id);
    this.logger.log(`Updated translations for service ${id} by user ${userId}`);
    return ServiceEntity.fromPrisma(updatedService);
  }

  async updateSEO(
    id: string,
    seoData: any,
    userId: string,
  ): Promise<ServiceEntity> {
    const currentService = await this.prisma.service.findUnique({
      where: { id },
    });
    if (!currentService) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }

    const metadata = (currentService.metadata as any) || {};
    if (!metadata.seo) metadata.seo = {};
    Object.assign(metadata.seo, seoData);
    metadata.lastUpdated = new Date();

    const updatedService = await this.prisma.service.update({
      where: { id },
      data: {
        metadata,
        updatedAt: new Date(),
      },
    });

    await this.clearCache(id);
    this.logger.log(`Updated SEO for service ${id} by user ${userId}`);
    return ServiceEntity.fromPrisma(updatedService);
  }

  async autoGenerateSEO(
    id: string,
    language: string = 'vi',
    userId: string,
  ): Promise<ServiceEntity> {
    const service = await this.findOne(id);
    const metadata = (service.metadata as any) || {};

    const translations = metadata.translations || {};
    const name =
      this.getTranslatedText(translations.name, language) || service.name;
    const description =
      this.getTranslatedText(translations.description, language) ||
      service.description;

    const seoData = {
      title: { [language]: name },
      description: { [language]: description || '' },
      keywords: {
        [language]: this.extractKeywords(
          (name || '') + ' ' + (description || ''),
          language,
        ),
      },
      slug: { [language]: this.generateSlug(name || '', language) },
      metaTitle: { [language]: name },
      metaDescription: {
        [language]: this.truncateText(description || '', 155),
      },
      ogTitle: { [language]: name },
      ogDescription: { [language]: this.truncateText(description || '', 155) },
      ogImage: service.imageUrl || '',
      schema: this.generateServiceSchema(
        name || '',
        description || '',
        service.type,
      ),
      isIndexable: true,
      priority: 0.7,
      changeFreq: 'weekly',
    };

    return this.updateSEO(id, seoData, userId);
  }

  async autoTranslate(
    id: string,
    sourceLanguage: string,
    targetLanguage: string,
    userId: string,
  ): Promise<ServiceEntity> {
    const mockTranslations = this.getMockTranslations(
      sourceLanguage,
      targetLanguage,
    );

    const service = await this.findOne(id);
    const metadata = (service.metadata as any) || {};
    const translations = metadata.translations || {};

    if (!translations.name) translations.name = {};
    if (!translations.description) translations.description = {};

    translations.name[targetLanguage] =
      mockTranslations[service.name] || service.name;
    translations.description[targetLanguage] =
      mockTranslations[service.description || ''] || service.description;

    return this.updateTranslations(id, translations, userId);
  }

  async generateSitemap(): Promise<string> {
    const services = await this.findAllAsEntities();
    const baseUrl = process.env.FRONTEND_URL || 'https://iccautotravel.com';

    let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
    sitemap +=
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n';

    for (const service of services) {
      if (!service.isActive) continue;

      const metadata = service.metadata as any;
      const seoData = metadata?.seo || {};

      ['vi', 'en', 'ko'].forEach((lang) => {
        const slug =
          seoData.slug?.[lang] || this.generateSlug(service.name, lang);
        const priority = seoData.priority || 0.7;
        const changefreq = seoData.changeFreq || 'weekly';

        sitemap += '  <url>\n';
        sitemap += `    <loc>${baseUrl}/${lang}/services/${slug}</loc>\n`;
        sitemap += `    <lastmod>${service.updatedAt.toISOString()}</lastmod>\n`;
        sitemap += `    <changefreq>${changefreq}</changefreq>\n`;
        sitemap += `    <priority>${priority}</priority>\n`;

        ['vi', 'en', 'ko'].forEach((altLang) => {
          if (altLang !== lang) {
            const altSlug =
              seoData.slug?.[altLang] ||
              this.generateSlug(service.name, altLang);
            sitemap += `    <xhtml:link rel="alternate" hreflang="${altLang}" href="${baseUrl}/${altLang}/services/${altSlug}" />\n`;
          }
        });

        sitemap += '  </url>\n';
      });
    }

    sitemap += '</urlset>';
    return sitemap;
  }

  async findFeatured(
    language: string = 'vi',
    limit: number = 6,
  ): Promise<ServiceEntity[]> {
    const result = await this.findAll({
      isActive: true,
      limit,
      page: 1,
    });

    return result.data
      .map((service) => this.localizeService(service, language))
      .slice(0, limit);
  }

  // ==========================================
  // PRIVATE HELPER METHODS
  // ==========================================

  private localizeService(
    service: ServiceEntity,
    language: string,
  ): ServiceEntity {
    const metadata = service.metadata as any;
    if (!metadata?.translations) return service;

    const localized = { ...service };
    const translations = metadata.translations;

    localized.name =
      this.getTranslatedText(translations.name, language) || service.name;
    localized.description =
      this.getTranslatedText(translations.description, language) ||
      service.description;

    const seoData = metadata.seo || {};
    if (seoData.slug?.[language]) {
      (localized as any).slug = seoData.slug[language];
    }

    (localized as any).localizedTypeName = this.getLocalizedTypeName(
      service.type,
      language,
    );

    if (translations.highlights) {
      localized.highlights = this.getTranslatedArray(
        translations.highlights,
        language,
      );
    }

    ['features', 'benefits', 'includes', 'excludes'].forEach((field) => {
      if (translations[field]) {
        (localized as any)[field] = this.getTranslatedArray(
          translations[field],
          language,
        );
      }
    });

    return localized;
  }

  private getTranslatedText(multiLangText: any, language: string): string {
    if (!multiLangText) return '';
    if (typeof multiLangText === 'string') return multiLangText;

    const languageMap = multiLangText as Record<string, string>;
    return (
      languageMap[language] ||
      languageMap['vi'] ||
      languageMap['en'] ||
      Object.values(languageMap)[0] ||
      ''
    );
  }

  private getTranslatedArray(multiLangArray: any, language: string): string[] {
    if (!multiLangArray) return [];
    if (Array.isArray(multiLangArray)) return multiLangArray;

    const languageMap = multiLangArray as Record<string, string[]>;
    return languageMap[language] || languageMap['vi'] || [];
  }

  private generateSlug(text: string, language: string): string {
    if (!text) return '';

    let slug = text.toLowerCase();

    if (language === 'vi') {
      const vietnameseMap: Record<string, string> = {
        à: 'a',
        á: 'a',
        ạ: 'a',
        ả: 'a',
        ã: 'a',
        â: 'a',
        ầ: 'a',
        ấ: 'a',
        ậ: 'a',
        ẩ: 'a',
        ẫ: 'a',
        ă: 'a',
        ằ: 'a',
        ắ: 'a',
        ặ: 'a',
        ẳ: 'a',
        ẵ: 'a',
        è: 'e',
        é: 'e',
        ẹ: 'e',
        ẻ: 'e',
        ẽ: 'e',
        ê: 'e',
        ề: 'e',
        ế: 'e',
        ệ: 'e',
        ể: 'e',
        ễ: 'e',
        ì: 'i',
        í: 'i',
        ị: 'i',
        ỉ: 'i',
        ĩ: 'i',
        ò: 'o',
        ó: 'o',
        ọ: 'o',
        ỏ: 'o',
        õ: 'o',
        ô: 'o',
        ồ: 'o',
        ố: 'o',
        ộ: 'o',
        ổ: 'o',
        ỗ: 'o',
        ơ: 'o',
        ờ: 'o',
        ớ: 'o',
        ợ: 'o',
        ở: 'o',
        ỡ: 'o',
        ù: 'u',
        ú: 'u',
        ụ: 'u',
        ủ: 'u',
        ũ: 'u',
        ư: 'u',
        ừ: 'u',
        ứ: 'u',
        ự: 'u',
        ử: 'u',
        ữ: 'u',
        ỳ: 'y',
        ý: 'y',
        ỵ: 'y',
        ỷ: 'y',
        ỹ: 'y',
        đ: 'd',
      };

      Object.keys(vietnameseMap).forEach((char) => {
        slug = slug.replace(new RegExp(char, 'g'), vietnameseMap[char]);
      });
    }

    return slug
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  private extractKeywords(text: string, language: string): string[] {
    if (!text) return [];

    const stopWords: Record<string, string[]> = {
      vi: [
        'và',
        'của',
        'với',
        'cho',
        'từ',
        'trong',
        'đến',
        'về',
        'có',
        'là',
        'một',
        'các',
        'được',
        'không',
        'để',
        'này',
        'đó',
      ],
      en: [
        'and',
        'or',
        'but',
        'in',
        'on',
        'at',
        'to',
        'for',
        'of',
        'with',
        'by',
        'from',
        'the',
        'a',
        'an',
        'is',
        'are',
        'was',
        'were',
      ],
      ko: [
        '그리고',
        '또는',
        '하지만',
        '에서',
        '에',
        '를',
        '을',
        '가',
        '이',
        '의',
        '와',
        '과',
        '로',
        '으로',
        '에게',
        '한테',
      ],
    };

    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((word) => word.length > 2)
      .filter((word) => !(stopWords[language] || []).includes(word))
      .slice(0, 10);
  }

  private truncateText(text: string, maxLength: number): string {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  private generateServiceSchema(
    name: string,
    description: string,
    type: string,
  ): Record<string, any> {
    return {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: name,
      description: description,
      serviceType: type,
      provider: {
        '@type': 'Organization',
        name: 'ICC Auto Travel',
      },
    };
  }

  private getLocalizedTypeName(type: ServiceType, language: string): string {
    const typeNames: Record<string, Record<string, string>> = {
      vi: {
        VEHICLE: 'Thuê xe',
        HOTEL: 'Khách sạn',
        TOUR: 'Tour du lịch',
        FLIGHT: 'Vé máy bay',
        TRANSFER: 'Đưa đón',
        VISA: 'Visa',
        INSURANCE: 'Bảo hiểm',
        FAST_TRACK: 'Fast Track',
        COMBO: 'Combo',
      },
      en: {
        VEHICLE: 'Car Rental',
        HOTEL: 'Hotel',
        TOUR: 'Tour',
        FLIGHT: 'Flight',
        TRANSFER: 'Transfer',
        VISA: 'Visa',
        INSURANCE: 'Insurance',
        FAST_TRACK: 'Fast Track',
        COMBO: 'Combo',
      },
      ko: {
        VEHICLE: '렌터카',
        HOTEL: '호텔',
        TOUR: '여행',
        FLIGHT: '항공편',
        TRANSFER: '이동 서비스',
        VISA: '비자',
        INSURANCE: '보험',
        FAST_TRACK: '패스트 트랙',
        COMBO: '콤보',
      },
    };

    const langTypeNames = typeNames[language];
    if (!langTypeNames) return type;

    return langTypeNames[type] || type;
  }

  private getMockTranslations(
    sourceLanguage: string,
    targetLanguage: string,
  ): Record<string, string> {
    const mockData: Record<string, Record<string, string>> = {
      'vi-en': {
        'Thuê xe': 'Car Rental',
        'Du lịch': 'Travel',
        'Dịch vụ': 'Service',
      },
      'vi-ko': {
        'Thuê xe': '렌터카',
        'Du lịch': '여행',
        'Dịch vụ': '서비스',
      },
      'en-vi': {
        'Car Rental': 'Thuê xe',
        Travel: 'Du lịch',
        Service: 'Dịch vụ',
      },
    };

    const key = `${sourceLanguage}-${targetLanguage}`;
    return mockData[key] || {};
  }

  private async clearCache(serviceId: string): Promise<void> {
    try {
      const patterns = [
        `${this.CACHE_KEY_PREFIX}:${serviceId}`,
        `${this.CACHE_KEY_PREFIX}:list:*`,
      ];

      for (const pattern of patterns) {
        await this.redisService.del(pattern);
      }
    } catch (error) {
      this.logger.warn(
        `Failed to clear cache for service ${serviceId}:`,
        error,
      );
    }
  }

  // Phương thức tìm kiếm nâng cao
  async advancedSearch(filters: AdvancedServiceFilterDto): Promise<{
    data: (ServiceEntity & { details?: any })[];
    metadata: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  }> {
    try {
      const {
        search,
        type,
        isActive,
        minPrice,
        maxPrice,
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = filters;

      this.logger.log(
        `Advanced search with filters: ${JSON.stringify(filters)}`,
      );

      // Base service filter
      const baseWhere: Prisma.ServiceWhereInput = {
        ...(type && { type }),
        ...(isActive !== undefined && { isActive }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        }),
      };

      let serviceIds: string[] = [];
      let shouldFilterByDetails = false;

      // Type-specific detail filtering
      if (type && this.hasDetailFilters(filters, type)) {
        shouldFilterByDetails = true;
        serviceIds = await this.getServiceIdsByDetailFilters(filters, type);

        // If no services match detail filters, return empty result
        if (serviceIds.length === 0) {
          return {
            data: [],
            metadata: {
              total: 0,
              page,
              limit,
              totalPages: 0,
              hasNextPage: false,
              hasPrevPage: false,
            },
          };
        }
      }

      // Combine base filters with detail filters
      const where: Prisma.ServiceWhereInput = {
        ...baseWhere,
        ...(shouldFilterByDetails && { id: { in: serviceIds } }),
      };

      const skip = (page - 1) * limit;
      const orderBy = this.buildOrderBy(sortBy, sortOrder);

      const [services, total] = await Promise.all([
        this.prisma.service.findMany({
          where,
          skip,
          take: limit,
          orderBy,
        }),
        this.prisma.service.count({ where }),
      ]);

      // Get details for each service
      const servicesWithDetails = await Promise.all(
        services.map(async (service) => {
          const serviceEntity = ServiceEntity.fromPrisma(service);
          const details = await this.getServiceDetails(
            service.id,
            service.type,
          );
          return { ...serviceEntity, details };
        }),
      );

      const totalPages = Math.ceil(total / limit);

      return {
        data: servicesWithDetails,
        metadata: {
          total,
          page,
          limit,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      };
    } catch (error: unknown) {
      this.logger.error(
        'Failed to perform advanced search',
        error instanceof Error ? error.stack : 'Unknown error',
      );
      throw error;
    }
  }

  private hasDetailFilters(
    filters: AdvancedServiceFilterDto,
    type: ServiceType,
  ): boolean {
    switch (type) {
      case ServiceType.VEHICLE:
        return !!(
          filters.vehicleBrand ||
          filters.vehicleType ||
          filters.minSeats ||
          filters.maxSeats ||
          filters.fuelType
        );
      case ServiceType.HOTEL:
        return !!(
          filters.minStarRating ||
          filters.maxStarRating ||
          filters.city ||
          filters.amenities?.length
        );
      case ServiceType.TOUR:
        return !!(
          filters.minDuration ||
          filters.maxDuration ||
          filters.minAdultPrice ||
          filters.maxAdultPrice
        );
      case ServiceType.FLIGHT:
        return !!(
          filters.airline ||
          filters.depAirportCode ||
          filters.arrAirportCode ||
          filters.fareClass
        );
      default:
        return false;
    }
  }

  private async getServiceIdsByDetailFilters(
    filters: AdvancedServiceFilterDto,
    type: ServiceType,
  ): Promise<string[]> {
    switch (type) {
      case ServiceType.VEHICLE:
        return this.getVehicleServiceIds(filters);
      case ServiceType.HOTEL:
        return this.getHotelServiceIds(filters);
      case ServiceType.TOUR:
        return this.getTourServiceIds(filters);
      case ServiceType.FLIGHT:
        return this.getFlightServiceIds(filters);
      default:
        return [];
    }
  }

  private async getVehicleServiceIds(
    filters: AdvancedServiceFilterDto,
  ): Promise<string[]> {
    const where: any = {};

    if (filters.vehicleBrand) {
      where.brand = { contains: filters.vehicleBrand, mode: 'insensitive' };
    }
    if (filters.vehicleType) {
      where.vehicleType = {
        contains: filters.vehicleType,
        mode: 'insensitive',
      };
    }
    if (filters.minSeats) {
      where.seats = { ...(where.seats || {}), gte: filters.minSeats };
    }
    if (filters.maxSeats) {
      where.seats = { ...(where.seats || {}), lte: filters.maxSeats };
    }
    if (filters.fuelType) {
      where.fuelType = { contains: filters.fuelType, mode: 'insensitive' };
    }
    if (filters.minPrice) {
      where.pricePerDay = {
        ...(where.pricePerDay || {}),
        gte: filters.minPrice,
      };
    }
    if (filters.maxPrice) {
      where.pricePerDay = {
        ...(where.pricePerDay || {}),
        lte: filters.maxPrice,
      };
    }

    const vehicles = await this.prisma.vehicleServiceDetail.findMany({
      where,
      select: { serviceId: true },
    });

    return vehicles.map((v) => v.serviceId);
  }

  private async getHotelServiceIds(
    filters: AdvancedServiceFilterDto,
  ): Promise<string[]> {
    const where: any = {};

    if (filters.minStarRating) {
      where.starRating = {
        ...(where.starRating || {}),
        gte: filters.minStarRating,
      };
    }
    if (filters.maxStarRating) {
      where.starRating = {
        ...(where.starRating || {}),
        lte: filters.maxStarRating,
      };
    }
    if (filters.city) {
      where.city = { contains: filters.city, mode: 'insensitive' };
    }
    if (filters.amenities?.length) {
      where.amenities = { hasSome: filters.amenities };
    }
    if (filters.minPrice) {
      where.basePrice = { ...(where.basePrice || {}), gte: filters.minPrice };
    }
    if (filters.maxPrice) {
      where.basePrice = { ...(where.basePrice || {}), lte: filters.maxPrice };
    }

    const hotels = await this.prisma.hotelServiceDetail.findMany({
      where,
      select: { serviceId: true },
    });

    return hotels.map((h) => h.serviceId);
  }

  private async getTourServiceIds(
    filters: AdvancedServiceFilterDto,
  ): Promise<string[]> {
    const where: any = {};

    if (filters.minDuration) {
      where.durationInDays = {
        ...(where.durationInDays || {}),
        gte: filters.minDuration,
      };
    }
    if (filters.maxDuration) {
      where.durationInDays = {
        ...(where.durationInDays || {}),
        lte: filters.maxDuration,
      };
    }
    if (filters.minAdultPrice) {
      where.adultPrice = {
        ...(where.adultPrice || {}),
        gte: filters.minAdultPrice,
      };
    }
    if (filters.maxAdultPrice) {
      where.adultPrice = {
        ...(where.adultPrice || {}),
        lte: filters.maxAdultPrice,
      };
    }

    const tours = await this.prisma.tourServiceDetail.findMany({
      where,
      select: { serviceId: true },
    });

    return tours.map((t) => t.serviceId);
  }

  private async getFlightServiceIds(
    filters: AdvancedServiceFilterDto,
  ): Promise<string[]> {
    const where: any = {};

    if (filters.airline) {
      where.airline = { contains: filters.airline, mode: 'insensitive' };
    }
    if (filters.depAirportCode) {
      where.depAirportCode = filters.depAirportCode;
    }
    if (filters.arrAirportCode) {
      where.arrAirportCode = filters.arrAirportCode;
    }
    if (filters.fareClass) {
      where.fareClass = { contains: filters.fareClass, mode: 'insensitive' };
    }
    if (filters.minPrice) {
      where.basePrice = { ...(where.basePrice || {}), gte: filters.minPrice };
    }
    if (filters.maxPrice) {
      where.basePrice = { ...(where.basePrice || {}), lte: filters.maxPrice };
    }

    const flights = await this.prisma.flightServiceDetail.findMany({
      where,
      select: { serviceId: true },
    });

    return flights.map((f) => f.serviceId);
  }

  private buildOrderBy(
    sortBy: string,
    sortOrder: string,
  ): Prisma.ServiceOrderByWithRelationInput {
    const order = sortOrder === 'asc' ? 'asc' : 'desc';

    switch (sortBy) {
      case 'name':
        return { name: order };
      case 'createdAt':
        return { createdAt: order };
      case 'updatedAt':
        return { updatedAt: order };
      default:
        return { createdAt: order };
    }
  }

  // ==========================================
  // ANALYTICS & DASHBOARD METHODS
  // ==========================================

  async getServiceAnalytics(): Promise<{
    overview: {
      totalServices: number;
      activeServices: number;
      totalBookings: number;
      totalRevenue: number;
    };
    byType: Record<
      ServiceType,
      {
        count: number;
        activeCount: number;
        avgPrice: number;
        totalBookings: number;
        revenue: number;
      }
    >;
    trends: {
      servicesCreatedLast30Days: number;
      servicesCreatedLast7Days: number;
      popularityByType: Array<{
        type: ServiceType;
        bookingCount: number;
        revenue: number;
      }>;
    };
    topPerforming: {
      services: Array<{
        id: string;
        name: string;
        type: ServiceType;
        bookingCount: number;
        revenue: number;
        avgRating: number;
      }>;
    };
  }> {
    try {
      // Get basic counts
      const [totalServices, activeServices] = await Promise.all([
        this.prisma.service.count(),
        this.prisma.service.count({ where: { isActive: true } }),
      ]);

      // Get services by type
      const servicesByType = await this.prisma.service.groupBy({
        by: ['type'],
        _count: true,
        where: { isActive: true },
      });

      // Get services created in last 30 and 7 days
      const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const [servicesLast30Days, servicesLast7Days] = await Promise.all([
        this.prisma.service.count({
          where: { createdAt: { gte: last30Days } },
        }),
        this.prisma.service.count({
          where: { createdAt: { gte: last7Days } },
        }),
      ]);

      // Calculate analytics by type
      const byType: Record<string, any> = {};

      for (const typeGroup of servicesByType) {
        const analytics = await this.getAnalyticsByType(typeGroup.type);
        byType[typeGroup.type] = {
          count: typeGroup._count,
          activeCount: typeGroup._count, // Since we filtered by active
          ...analytics,
        };
      }

      // Get top performing services (mock data for now since we don't have booking relations)
      const topServices = await this.getTopPerformingServices();

      return {
        overview: {
          totalServices,
          activeServices,
          totalBookings: 0, // To be implemented when booking relations are ready
          totalRevenue: 0,
        },
        byType: byType as any,
        trends: {
          servicesCreatedLast30Days: servicesLast30Days,
          servicesCreatedLast7Days: servicesLast7Days,
          popularityByType: [], // To be implemented with booking data
        },
        topPerforming: {
          services: topServices,
        },
      };
    } catch (error) {
      this.logger.error('Failed to get service analytics:', error);
      throw error;
    }
  }

  private async getAnalyticsByType(type: ServiceType): Promise<{
    avgPrice: number;
    totalBookings: number;
    revenue: number;
  }> {
    try {
      switch (type) {
        case ServiceType.VEHICLE:
          return this.getVehicleAnalytics();
        case ServiceType.HOTEL:
          return this.getHotelAnalytics();
        case ServiceType.TOUR:
          return this.getTourAnalytics();
        case ServiceType.FLIGHT:
          return this.getFlightAnalytics();
        default:
          return { avgPrice: 0, totalBookings: 0, revenue: 0 };
      }
    } catch (error) {
      this.logger.error(`Failed to get analytics for type ${type}:`, error);
      return { avgPrice: 0, totalBookings: 0, revenue: 0 };
    }
  }

  private async getVehicleAnalytics(): Promise<{
    avgPrice: number;
    totalBookings: number;
    revenue: number;
  }> {
    const vehicles = await this.prisma.vehicleServiceDetail.aggregate({
      _avg: { pricePerDay: true },
      _count: true,
    });

    return {
      avgPrice: Number(vehicles._avg.pricePerDay) || 0,
      totalBookings: 0, // To be implemented
      revenue: 0, // To be implemented
    };
  }

  private async getHotelAnalytics(): Promise<{
    avgPrice: number;
    totalBookings: number;
    revenue: number;
  }> {
    const hotels = await this.prisma.hotelServiceDetail.aggregate({
      _avg: { basePrice: true },
      _count: true,
    });

    return {
      avgPrice: Number(hotels._avg.basePrice) || 0,
      totalBookings: 0,
      revenue: 0,
    };
  }

  private async getTourAnalytics(): Promise<{
    avgPrice: number;
    totalBookings: number;
    revenue: number;
  }> {
    const tours = await this.prisma.tourServiceDetail.aggregate({
      _avg: { adultPrice: true },
      _count: true,
    });

    return {
      avgPrice: Number(tours._avg.adultPrice) || 0,
      totalBookings: 0,
      revenue: 0,
    };
  }

  private async getFlightAnalytics(): Promise<{
    avgPrice: number;
    totalBookings: number;
    revenue: number;
  }> {
    const flights = await this.prisma.flightServiceDetail.aggregate({
      _avg: { basePrice: true },
      _count: true,
    });

    return {
      avgPrice: Number(flights._avg.basePrice) || 0,
      totalBookings: 0,
      revenue: 0,
    };
  }

  private async getTopPerformingServices(): Promise<
    Array<{
      id: string;
      name: string;
      type: ServiceType;
      bookingCount: number;
      revenue: number;
      avgRating: number;
    }>
  > {
    // For now, return top 10 services by creation date
    // This should be replaced with actual booking and rating data
    const services = await this.prisma.service.findMany({
      where: { isActive: true },
      take: 10,
      orderBy: { createdAt: 'desc' },
    });

    return services.map((service) => ({
      id: service.id,
      name: service.name,
      type: service.type,
      bookingCount: Math.floor(Math.random() * 100), // Mock data
      revenue: Math.floor(Math.random() * 10000000), // Mock data
      avgRating: Number((Math.random() * 2 + 3).toFixed(1)), // Mock rating 3-5
    }));
  }

  async getServiceTrendData(
    type?: ServiceType,
    period: 'week' | 'month' | 'quarter' | 'year' = 'month',
  ): Promise<{
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      type: 'created' | 'bookings' | 'revenue';
    }>;
  }> {
    const periodMap = {
      week: 7,
      month: 30,
      quarter: 90,
      year: 365,
    };

    const days = periodMap[period];
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Generate date labels
    const labels: string[] = [];
    const createdData: number[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      labels.push(date.toISOString().split('T')[0]);

      // Get services created on this date
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));

      const count = await this.prisma.service.count({
        where: {
          ...(type && { type }),
          createdAt: {
            gte: dayStart,
            lte: dayEnd,
          },
        },
      });

      createdData.push(count);
    }

    return {
      labels,
      datasets: [
        {
          label: 'Services Created',
          data: createdData,
          type: 'created',
        },
        // Add more datasets for bookings and revenue when available
      ],
    };
  }

  async getServiceDistributionByLocation(): Promise<{
    cities: Array<{
      city: string;
      count: number;
      types: Record<ServiceType, number>;
    }>;
    countries: Array<{
      country: string;
      count: number;
    }>;
  }> {
    // Get hotel locations
    const hotelLocations = await this.prisma.hotelServiceDetail.groupBy({
      by: ['city', 'country'],
      _count: true,
      where: {
        city: { not: null },
        country: { not: null },
      },
    });

    // Aggregate by city
    const cityMap = new Map<
      string,
      { count: number; types: Record<string, number> }
    >();
    const countryMap = new Map<string, number>();

    hotelLocations.forEach((location) => {
      if (location.city) {
        const existing = cityMap.get(location.city) || { count: 0, types: {} };
        existing.count += location._count;
        existing.types['HOTEL'] =
          (existing.types['HOTEL'] || 0) + location._count;
        cityMap.set(location.city, existing);
      }

      if (location.country) {
        countryMap.set(
          location.country,
          (countryMap.get(location.country) || 0) + location._count,
        );
      }
    });

    return {
      cities: Array.from(cityMap.entries()).map(([city, data]) => ({
        city,
        count: data.count,
        types: data.types as any,
      })),
      countries: Array.from(countryMap.entries()).map(([country, count]) => ({
        country,
        count,
      })),
    };
  }

  // ==========================================
  // MULTILINGUAL SERVICE DETAILS SUPPORT
  // ==========================================

  async updateServiceDetailTranslations(
    serviceId: string,
    translations: UpdateMultilingualServiceDetailDto,
    userId: string,
  ): Promise<ServiceEntity & { details?: any; localizedDetails?: any }> {
    try {
      const service = await this.findOne(serviceId);

      // Update main service translations first
      if (translations.name || translations.description) {
        await this.updateTranslations(
          serviceId,
          {
            name: translations.name,
            description: translations.description,
          },
          userId,
        );
      }

      // Update service-specific detail translations
      await this.updateDetailTranslationsByType(
        serviceId,
        service.type,
        translations,
      );

      // Return updated service with details
      return this.findOneWithDetails(serviceId);
    } catch (error) {
      this.logger.error(
        `Failed to update service detail translations for ${serviceId}:`,
        error,
      );
      throw error;
    }
  }

  private async updateDetailTranslationsByType(
    serviceId: string,
    serviceType: ServiceType,
    translations: UpdateMultilingualServiceDetailDto,
  ): Promise<void> {
    switch (serviceType) {
      case ServiceType.VEHICLE:
        await this.updateVehicleDetailTranslations(serviceId, translations);
        break;
      case ServiceType.HOTEL:
        await this.updateHotelDetailTranslations(serviceId, translations);
        break;
      case ServiceType.TOUR:
        await this.updateTourDetailTranslations(serviceId, translations);
        break;
      case ServiceType.FLIGHT:
        await this.updateFlightDetailTranslations(serviceId, translations);
        break;
      default:
        this.logger.warn(
          `Multilingual update not implemented for type: ${serviceType}`,
        );
    }
  }

  private async updateVehicleDetailTranslations(
    serviceId: string,
    translations: UpdateMultilingualServiceDetailDto,
  ): Promise<void> {
    const existingDetail = await this.prisma.vehicleServiceDetail.findUnique({
      where: { serviceId },
    });

    if (!existingDetail) return;

    const currentDescription = existingDetail.description || '{}';
    let descriptionObj: any = {};

    try {
      descriptionObj =
        typeof currentDescription === 'string'
          ? JSON.parse(currentDescription)
          : currentDescription;
    } catch {
      descriptionObj = {};
    }

    // Merge new translations
    const updatedDescription = {
      ...descriptionObj,
      multilingual: {
        ...descriptionObj.multilingual,
        vehicleType:
          translations.vehicleType || descriptionObj.multilingual?.vehicleType,
        features:
          translations.features || descriptionObj.multilingual?.features,
        description:
          translations.description || descriptionObj.multilingual?.description,
      },
    };

    await this.prisma.vehicleServiceDetail.update({
      where: { serviceId },
      data: {
        description: JSON.stringify(updatedDescription),
      },
    });
  }

  private async updateHotelDetailTranslations(
    serviceId: string,
    translations: UpdateMultilingualServiceDetailDto,
  ): Promise<void> {
    const existingDetail = await this.prisma.hotelServiceDetail.findUnique({
      where: { serviceId },
    });

    if (!existingDetail) return;

    const currentDescription = existingDetail.description || '{}';
    let descriptionObj: any = {};

    try {
      descriptionObj =
        typeof currentDescription === 'string'
          ? JSON.parse(currentDescription)
          : currentDescription;
    } catch {
      descriptionObj = {};
    }

    const updatedDescription = {
      ...descriptionObj,
      multilingual: {
        ...descriptionObj.multilingual,
        hotelName:
          translations.hotelName || descriptionObj.multilingual?.hotelName,
        roomType:
          translations.roomType || descriptionObj.multilingual?.roomType,
        amenities:
          translations.amenities || descriptionObj.multilingual?.amenities,
        address: translations.address || descriptionObj.multilingual?.address,
        description:
          translations.description || descriptionObj.multilingual?.description,
      },
    };

    await this.prisma.hotelServiceDetail.update({
      where: { serviceId },
      data: {
        description: JSON.stringify(updatedDescription),
      },
    });
  }

  private async updateTourDetailTranslations(
    serviceId: string,
    translations: UpdateMultilingualServiceDetailDto,
  ): Promise<void> {
    const existingDetail = await this.prisma.tourServiceDetail.findUnique({
      where: { serviceId },
    });

    if (!existingDetail) return;

    const currentDescription = existingDetail.description || '{}';
    let descriptionObj: any = {};

    try {
      descriptionObj =
        typeof currentDescription === 'string'
          ? JSON.parse(currentDescription)
          : currentDescription;
    } catch {
      descriptionObj = {};
    }

    const updatedDescription = {
      ...descriptionObj,
      multilingual: {
        ...descriptionObj.multilingual,
        tourName:
          translations.tourName || descriptionObj.multilingual?.tourName,
        itinerary:
          translations.itinerary || descriptionObj.multilingual?.itinerary,
        includes:
          translations.includes || descriptionObj.multilingual?.includes,
        excludes:
          translations.excludes || descriptionObj.multilingual?.excludes,
        description:
          translations.description || descriptionObj.multilingual?.description,
      },
    };

    await this.prisma.tourServiceDetail.update({
      where: { serviceId },
      data: {
        description: JSON.stringify(updatedDescription),
      },
    });
  }

  private async updateFlightDetailTranslations(
    serviceId: string,
    translations: UpdateMultilingualServiceDetailDto,
  ): Promise<void> {
    const existingDetail = await this.prisma.flightServiceDetail.findUnique({
      where: { serviceId },
    });

    if (!existingDetail) return;

    const currentDescription = existingDetail.description || '{}';
    let descriptionObj: any = {};

    try {
      descriptionObj =
        typeof currentDescription === 'string'
          ? JSON.parse(currentDescription)
          : currentDescription;
    } catch {
      descriptionObj = {};
    }

    const updatedDescription = {
      ...descriptionObj,
      multilingual: {
        ...descriptionObj.multilingual,
        airlineName:
          translations.airlineName || descriptionObj.multilingual?.airlineName,
        departureLocation:
          translations.departureLocation ||
          descriptionObj.multilingual?.departureLocation,
        arrivalLocation:
          translations.arrivalLocation ||
          descriptionObj.multilingual?.arrivalLocation,
        description:
          translations.description || descriptionObj.multilingual?.description,
      },
    };

    await this.prisma.flightServiceDetail.update({
      where: { serviceId },
      data: {
        description: JSON.stringify(updatedDescription),
      },
    });
  }

  async getLocalizedServiceDetails(
    serviceId: string,
    language: 'vi' | 'en' | 'ko' = 'vi',
  ): Promise<ServiceEntity & { details?: any; localizedDetails?: any }> {
    const serviceWithDetails = await this.findOneWithDetails(serviceId);
    const localizedService = this.localizeService(serviceWithDetails, language);

    // Localize service details
    if (serviceWithDetails.details) {
      const localizedDetails = this.localizeServiceDetails(
        serviceWithDetails.details,
        serviceWithDetails.type,
        language,
      );

      return {
        ...localizedService,
        details: serviceWithDetails.details, // Keep original details
        // Add localized version
        localizedDetails: localizedDetails,
      };
    }

    return localizedService;
  }

  private localizeServiceDetails(
    details: any,
    serviceType: ServiceType,
    language: string,
  ): any {
    if (!details) return details;

    try {
      let descriptionObj: any = {};

      if (details.description) {
        try {
          descriptionObj =
            typeof details.description === 'string'
              ? JSON.parse(details.description)
              : details.description;
        } catch {
          descriptionObj = {};
        }
      }

      const multilingual = descriptionObj.multilingual || {};

      switch (serviceType) {
        case ServiceType.VEHICLE:
          return {
            ...details,
            vehicleType:
              this.getLocalizedText(multilingual.vehicleType, language) ||
              details.vehicleType,
            features:
              this.getLocalizedArray(multilingual.features, language) || [],
            localizedDescription:
              this.getLocalizedText(multilingual.description, language) ||
              details.description,
          };

        case ServiceType.HOTEL:
          return {
            ...details,
            hotelName:
              this.getLocalizedText(multilingual.hotelName, language) ||
              details.hotelName,
            roomType:
              this.getLocalizedText(multilingual.roomType, language) ||
              details.roomType,
            amenities:
              this.getLocalizedArray(multilingual.amenities, language) ||
              details.amenities,
            address:
              this.getLocalizedText(multilingual.address, language) ||
              details.address,
            localizedDescription:
              this.getLocalizedText(multilingual.description, language) ||
              details.description,
          };

        case ServiceType.TOUR:
          const localizedItinerary: any = {};
          if (multilingual.itinerary) {
            Object.keys(multilingual.itinerary).forEach((day) => {
              localizedItinerary[day] = this.getLocalizedText(
                multilingual.itinerary[day],
                language,
              );
            });
          }

          return {
            ...details,
            tourName:
              this.getLocalizedText(multilingual.tourName, language) ||
              details.name,
            itinerary:
              Object.keys(localizedItinerary).length > 0
                ? localizedItinerary
                : details.itinerary,
            includes:
              this.getLocalizedArray(multilingual.includes, language) || [],
            excludes:
              this.getLocalizedArray(multilingual.excludes, language) || [],
            localizedDescription:
              this.getLocalizedText(multilingual.description, language) ||
              details.description,
          };

        case ServiceType.FLIGHT:
          return {
            ...details,
            airlineName:
              this.getLocalizedText(multilingual.airlineName, language) ||
              details.airline,
            departureLocation:
              this.getLocalizedText(multilingual.departureLocation, language) ||
              details.depAirportCode,
            arrivalLocation:
              this.getLocalizedText(multilingual.arrivalLocation, language) ||
              details.arrAirportCode,
            localizedDescription:
              this.getLocalizedText(multilingual.description, language) ||
              details.description,
          };

        default:
          return details;
      }
    } catch (error) {
      this.logger.error(`Failed to localize service details:`, error);
      return details;
    }
  }

  private getLocalizedText(
    multilingualText: MultilingualText | undefined,
    language: string,
  ): string | undefined {
    if (!multilingualText) return undefined;
    return (
      multilingualText[language as keyof MultilingualText] ||
      multilingualText.vi ||
      multilingualText.en ||
      Object.values(multilingualText)[0]
    );
  }

  private getLocalizedArray(
    multilingualArray: MultilingualArray | undefined,
    language: string,
  ): string[] | undefined {
    if (!multilingualArray) return undefined;
    return (
      multilingualArray[language as keyof MultilingualArray] ||
      multilingualArray.vi ||
      multilingualArray.en ||
      Object.values(multilingualArray)[0]
    );
  }

  // =================== DETAIL → SERVICE CREATION METHODS ===================

  /**
   * Create FastTrack detail and auto-create Service if needed
   */
  async createFastTrackDetailWithService(createDetailDto: any): Promise<any> {
    try {
      let serviceId = createDetailDto.serviceId;

      // If no serviceId provided, create a new Service
      if (!serviceId) {
        if (!createDetailDto.serviceName) {
          throw new ValidationException(ErrorCodes.SERVICE_CREATION_FAILED, {
            field: 'serviceName',
            message:
              'Service name is required when creating detail without serviceId',
          });
        }

        const serviceData: CreateServiceDto = {
          name: createDetailDto.serviceName,
          type: ServiceType.FAST_TRACK,
          description:
            createDetailDto.serviceDescription ||
            createDetailDto.description ||
            '',
          isActive: createDetailDto.isActive ?? true,
          metadata: {
            fastTrackDetails: {
              airportCode: createDetailDto.airportCode,
              serviceLevel: createDetailDto.serviceLevel,
              basePrice: createDetailDto.basePrice,
              description: createDetailDto.description,
            },
          },
        };

        const service = await this.create(serviceData, 'system');
        serviceId = service.id;
      } else {
        // If serviceId provided, just create the detail
        const detailData = {
          id: crypto.randomUUID(),
          serviceId,
          airportCode: createDetailDto.airportCode,
          serviceLevel: createDetailDto.serviceLevel,
          basePrice: createDetailDto.basePrice,
          description: createDetailDto.description,
        };

        await this.prisma.fastTrackServiceDetail.create({
          data: detailData,
        });
      }

      // Return the complete service with details
      return await this.findOneWithDetails(serviceId);
    } catch (error) {
      this.logger.error('Failed to create FastTrack detail:', error);
      throw error;
    }
  }

  /**
   * Create Vehicle detail and auto-create Service if needed
   */
  async createVehicleDetailWithService(createDetailDto: any): Promise<any> {
    try {
      let serviceId = createDetailDto.serviceId;

      // If no serviceId provided, create a new Service
      if (!serviceId) {
        if (!createDetailDto.serviceName) {
          throw new ValidationException(ErrorCodes.SERVICE_CREATION_FAILED, {
            field: 'serviceName',
            message:
              'Service name is required when creating detail without serviceId',
          });
        }

        const serviceData: CreateServiceDto = {
          name: createDetailDto.serviceName,
          type: ServiceType.VEHICLE,
          description:
            createDetailDto.serviceDescription ||
            createDetailDto.description ||
            '',
          isActive: createDetailDto.isActive ?? true,
          metadata: {
            vehicleDetails: {
              vehicleType: createDetailDto.vehicleType,
              brand: createDetailDto.brand,
              model: createDetailDto.model,
              licensePlate: createDetailDto.licensePlate,
              seats: createDetailDto.seats,
              fuelType: createDetailDto.fuelType,
              pricePerDay: createDetailDto.pricePerDay,
              extras: createDetailDto.extras,
              pickupLocation: createDetailDto.pickupLocation,
              pickupLatitude: createDetailDto.pickupLatitude,
              pickupLongitude: createDetailDto.pickupLongitude,
              dropoffLocation: createDetailDto.dropoffLocation,
              dropoffLatitude: createDetailDto.dropoffLatitude,
              dropoffLongitude: createDetailDto.dropoffLongitude,
              description: createDetailDto.description,
            },
          },
        };

        const service = await this.create(serviceData, 'system');
        serviceId = service.id;
      } else {
        // If serviceId provided, just create the detail
        const detailData = {
          id: crypto.randomUUID(),
          serviceId,
          vehicleType: createDetailDto.vehicleType,
          brand: createDetailDto.brand,
          model: createDetailDto.model,
          licensePlate: createDetailDto.licensePlate,
          seats: createDetailDto.seats,
          fuelType: createDetailDto.fuelType,
          pricePerDay: createDetailDto.pricePerDay,
          extras: createDetailDto.extras,
          pickupLocation: createDetailDto.pickupLocation,
          pickupLatitude: createDetailDto.pickupLatitude,
          pickupLongitude: createDetailDto.pickupLongitude,
          dropoffLocation: createDetailDto.dropoffLocation,
          dropoffLatitude: createDetailDto.dropoffLatitude,
          dropoffLongitude: createDetailDto.dropoffLongitude,
          description: createDetailDto.description,
        };

        await this.prisma.vehicleServiceDetail.create({
          data: detailData,
        });
      }

      // Return the complete service with details
      return await this.findOneWithDetails(serviceId);
    } catch (error) {
      this.logger.error('Failed to create Vehicle detail:', error);
      throw error;
    }
  }

  /**
   * Create Tour detail and auto-create Service if needed
   */
  async createTourDetailWithService(createDetailDto: any): Promise<any> {
    try {
      let serviceId = createDetailDto.serviceId;

      // If no serviceId provided, create a new Service
      if (!serviceId) {
        if (!createDetailDto.serviceName) {
          throw new ValidationException(ErrorCodes.SERVICE_CREATION_FAILED, {
            field: 'serviceName',
            message:
              'Service name is required when creating detail without serviceId',
          });
        }

        const serviceData: CreateServiceDto = {
          name: createDetailDto.serviceName,
          type: ServiceType.TOUR,
          description:
            createDetailDto.serviceDescription ||
            createDetailDto.description ||
            '',
          isActive: createDetailDto.isActive ?? true,
          metadata: {
            tourDetails: {
              tourCode:
                createDetailDto.tourCode ||
                `TOUR-${crypto.randomUUID().substring(0, 8).toUpperCase()}`,
              itinerary: createDetailDto.itinerary || {},
              departureDates: createDetailDto.departureDates || [],
              adultPrice: createDetailDto.adultPrice,
              childPrice: createDetailDto.childPrice,
              seatsAvailable: createDetailDto.seatsAvailable,
              minPax: createDetailDto.minPax || 1,
              maxPax: createDetailDto.maxPax || createDetailDto.seatsAvailable,
              durationInDays: createDetailDto.durationInDays || 1,
              description: createDetailDto.description,
            },
          },
        };

        const service = await this.create(serviceData, 'system');
        serviceId = service.id;
      } else {
        // If serviceId provided, just create the detail
        const detailData = {
          id: crypto.randomUUID(),
          serviceId,
          tourCode: `TOUR-${crypto.randomUUID().substring(0, 8).toUpperCase()}`,
          itinerary: createDetailDto.itinerary || {},
          departureDates: createDetailDto.departureDates || [],
          adultPrice:
            createDetailDto.basePrice || createDetailDto.adultPrice || 0,
          childPrice: createDetailDto.childPrice || null,
          seatsAvailable:
            createDetailDto.maxGroupSize ||
            createDetailDto.seatsAvailable ||
            10,
          minPax: createDetailDto.minPax || 1,
          maxPax: createDetailDto.maxGroupSize || createDetailDto.maxPax || 20,
          durationInDays:
            createDetailDto.duration || createDetailDto.durationInDays || 1,
          description: createDetailDto.description,
        };

        await this.prisma.tourServiceDetail.create({
          data: detailData,
        });
      }

      // Return the complete service with details
      return await this.findOneWithDetails(serviceId);
    } catch (error) {
      this.logger.error('Failed to create Tour detail:', error);
      throw error;
    }
  }

  /**
   * Generic method to create any detail type and auto-create Service if needed
   */
  async createDetailWithService(
    detailType: ServiceType,
    createDetailDto: any,
  ): Promise<any> {
    switch (detailType) {
      case ServiceType.FAST_TRACK:
        return await this.createFastTrackDetailWithService(createDetailDto);
      case ServiceType.VEHICLE:
        return await this.createVehicleDetailWithService(createDetailDto);
      case ServiceType.TOUR:
        return await this.createTourDetailWithService(createDetailDto);
      default:
        throw new ValidationException(ErrorCodes.SERVICE_CREATION_FAILED, {
          field: 'detailType',
          message: `Detail creation not supported for service type: ${detailType}`,
        });
    }
  }
}
