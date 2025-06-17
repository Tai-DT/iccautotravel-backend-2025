import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { Prisma, Service, ServiceType } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { PaginationDto } from '../common/dto/pagination.dto';
import { ServiceFilterInput } from './dto/service-filter.input';

@Injectable()
export class ServicesService {
  private readonly logger = new Logger(ServicesService.name);
  private readonly CACHE_KEY_PREFIX = 'service';

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  async create(
    createServiceDto: CreateServiceDto,
    userId: string /* For logging/auth if needed */,
  ): Promise<Service> {
    const { ...restOfDto } = createServiceDto;
    const now = new Date();
    const newId = uuidv4();

    const data: Prisma.ServiceCreateInput = {
      id: newId,
      type: restOfDto.type,
      name: restOfDto.name,
      description: restOfDto.description,
      isActive: restOfDto.isActive === undefined ? true : restOfDto.isActive,
      createdAt: now,
      updatedAt: now,
    };

    const newService = await this.prisma.service.create({
      data,
    });

    await this.redisService.del(`${this.CACHE_KEY_PREFIX}_all_active`);
    this.logger.log(
      `Service created with ID: ${newService.id} by user (logged): ${userId}`,
    );
    return newService;
  }

  async findAll(
    type?: ServiceType /* Optional filter by type */,
  ): Promise<Service[]> {
    const cacheKey = `${this.CACHE_KEY_PREFIX}_all${type ? '_type_' + type : ''}_active`;
    const cachedServices = await this.redisService.get(cacheKey);
    if (cachedServices) {
      this.logger.log(`Cache hit for key: ${cacheKey}`);
      try {
        return JSON.parse(cachedServices) as Service[];
      } catch (e) {
        this.logger.error(
          `Failed to parse cached services for key ${cacheKey}`,
          e,
        );
      }
    }
    this.logger.log(`Cache miss for key: ${cacheKey}`);

    const whereClause: Prisma.ServiceWhereInput = { isActive: true };
    if (type) whereClause.type = type;

    const services = await this.prisma.service.findMany({
      where: whereClause,
      orderBy: { name: 'asc' },
    });

    if (services.length > 0) {
      await this.redisService.set(cacheKey, JSON.stringify(services));
    }
    return services;
  }

  async findOne(id: string): Promise<Service | null> {
    const cacheKey = `${this.CACHE_KEY_PREFIX}_${id}_active`;
    const cachedService = await this.redisService.get(cacheKey);
    if (cachedService) {
      this.logger.log(`Cache hit for key: ${cacheKey}`);
      try {
        return JSON.parse(cachedService) as Service;
      } catch (e) {
        this.logger.error(
          `Failed to parse cached service for key ${cacheKey}`,
          e,
        );
      }
    }
    this.logger.log(`Cache miss for key: ${cacheKey}`);

    const service = await this.prisma.service.findFirst({
      where: { id, isActive: true },
    });

    if (!service) {
      throw new NotFoundException(`Active service with ID "${id}" not found`);
    }
    await this.redisService.set(cacheKey, JSON.stringify(service));
    return service;
  }

  async update(
    id: string,
    updateServiceDto: UpdateServiceDto,
    userId: string /* For logging/auth */,
  ): Promise<Service> {
    const currentService = await this.prisma.service.findUnique({
      where: { id },
    });
    if (!currentService) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }

    const { ...scalarUpdates } = updateServiceDto;

    const data: Prisma.ServiceUpdateInput = {
      ...scalarUpdates,
      updatedAt: new Date(),
    };

    const updatedService = await this.prisma.service.update({
      where: { id },
      data,
    });

    await this.redisService.del(`${this.CACHE_KEY_PREFIX}_all_active`);
    await this.redisService.del(`${this.CACHE_KEY_PREFIX}_${id}_active`);
    if (currentService.type !== updatedService.type) {
      await this.redisService.del(
        `${this.CACHE_KEY_PREFIX}_all_type_${currentService.type}_active`,
      );
      await this.redisService.del(
        `${this.CACHE_KEY_PREFIX}_all_type_${updatedService.type}_active`,
      );
    }
    if (updatedService.type) {
      await this.redisService.del(
        `${this.CACHE_KEY_PREFIX}_all_type_${updatedService.type}_active`,
      );
    }

    this.logger.log(`Service ${id} updated by user (logged): ${userId}`);
    return updatedService;
  }

  async remove(
    id: string,
    userId: string /* For logging/auth */,
  ): Promise<Service> {
    const serviceToDeactivate = await this.prisma.service.findUnique({
      where: { id },
    });
    if (!serviceToDeactivate) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }

    const deactivatedService = await this.prisma.service.update({
      where: { id },
      data: { isActive: false, updatedAt: new Date() },
    });

    await this.redisService.del(`${this.CACHE_KEY_PREFIX}_all_active`);
    await this.redisService.del(`${this.CACHE_KEY_PREFIX}_${id}_active`);
    if (deactivatedService.type) {
      await this.redisService.del(
        `${this.CACHE_KEY_PREFIX}_all_type_${deactivatedService.type}_active`,
      );
    }

    this.logger.log(`Service ${id} deactivated by user (logged): ${userId}`);
    return deactivatedService;
  }

  async findAllWithPagination(
    paginationDto: PaginationDto,
    filters: ServiceFilterInput,
  ): Promise<{ data: Service[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const whereClause: Prisma.ServiceWhereInput = { isActive: true };

    if (filters.type) {
      whereClause.type = filters.type;
    }
    if (filters.isActive !== undefined) {
      whereClause.isActive = filters.isActive;
    }
    if (filters.name) {
      whereClause.name = { contains: filters.name, mode: 'insensitive' };
    }

    const [data, total] = await Promise.all([
      this.prisma.service.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.service.count({ where: whereClause }),
    ]);

    return { data, total, page, limit };
  }

  async generateServiceAudio(
    serviceId: string,
    lang: string,
    userId?: string,
  ): Promise<void> {
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
    });
    if (!service) {
      throw new NotFoundException(`Service with ID ${serviceId} not found`);
    }

    this.logger.log(
      `Generating audio for service ${serviceId} in language ${lang} by user ${userId || 'system'}`,
    );
  }

  // Entity-returning methods used by specialized service modules

  async createAsEntity(
    createServiceDto: CreateServiceDto,
    userId: string,
  ): Promise<any> {
    const service = await this.create(createServiceDto, userId);

    // Convert to entity - assuming there's a ServiceEntity class with a fromPrisma method
    // If there isn't, we need to create one or adapt this method to whatever entity structure is expected
    return this.toEntity(service);
  }

  async updateAsEntity(
    id: string,
    updateServiceDto: UpdateServiceDto,
    userId: string,
  ): Promise<any> {
    const service = await this.update(id, updateServiceDto, userId);

    // Convert to entity
    return this.toEntity(service);
  }

  async findAllAsEntities(type?: ServiceType): Promise<any[]> {
    const services = await this.findAll(type);

    // Convert all services to entities
    return services.map((service) => this.toEntity(service));
  }

  async findOneAsEntity(id: string): Promise<any> {
    const service = await this.findOne(id);

    // Convert to entity
    return this.toEntity(service);
  }

  async removeAsEntity(id: string, userId: string): Promise<any> {
    const service = await this.remove(id, userId);

    // Convert to entity
    return this.toEntity(service);
  }

  // Service audio generation methods referenced in the resolver
  async getServiceAudio(serviceId: string): Promise<string | null> {
    const service = await this.findOne(serviceId);
    if (!service) return null;

    // Return the audio file ID (male or female, whichever is available)
    return (
      (service as any).audioFileMaleId ||
      (service as any).audioFileFemaleId ||
      null
    );
  }

  async generateAudioForAllServices(
    lang: string,
    userId?: string,
  ): Promise<void> {
    // Implementation for generating audio for all services
    this.logger.log(`Generating audio for all services in language ${lang}`);
  }

  // Helper method to convert a service to an entity
  private toEntity(service: Service | null): any {
    if (!service) return null;

    // If there's a ServiceEntity class, return an instance of it
    // For now, just return the service as-is
    return {
      ...service,
      // Add any additional entity properties or transformations here
      audioFileMaleId: (service as any).audioFileMaleId,
      audioFileFemaleId: (service as any).audioFileFemaleId,
    };
  }
}
