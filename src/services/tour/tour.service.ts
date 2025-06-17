import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTourServiceInput } from './dto/create-tour-service.input';
import { UpdateTourServiceInput } from './dto/update-tour-service.input';
import { ServiceType } from '@prisma/client';
import { ServicesService } from '../services.service';
import { ServiceEntity, ServiceWithExtras } from '../entities/service.entity';
import { CreateServiceDto } from '../dto/create-service.dto';
import { UpdateServiceDto } from '../dto/update-service.dto';

@Injectable()
export class TourService {
  constructor(
    private prisma: PrismaService,
    private servicesService: ServicesService,
  ) {}

  async create(
    createTourServiceInput: CreateTourServiceInput,
    userId: string,
  ): Promise<ServiceEntity> {
    const { tourDetails, name, ...restBaseInput } = createTourServiceInput;

    if (name === undefined) {
      throw new Error('Service name is required for tour creation.');
    }

    const serviceInput: CreateServiceDto = {
      ...restBaseInput,
      name,
      type: ServiceType.TOUR,
      metadata: tourDetails || null,
    };
    return this.servicesService.createAsEntity(serviceInput, userId);
  }

  async findAll(): Promise<ServiceEntity[]> {
    return this.servicesService.findAllAsEntities(ServiceType.TOUR);
  }

  async findOne(id: string): Promise<ServiceEntity> {
    const service = await this.servicesService.findOne(id);
    if (!service || service.type !== ServiceType.TOUR) {
      throw new NotFoundException(
        `Tour service with ID "${id}" not found or not of type TOUR`,
      );
    }
    return ServiceEntity.fromPrisma(service as unknown as ServiceWithExtras);
  }

  async update(
    id: string,
    updateTourServiceInput: UpdateTourServiceInput,
    userId: string,
  ): Promise<ServiceEntity> {
    await this.findOne(id);

    const { tourDetails, ...restUpdateData } = updateTourServiceInput;

    const serviceUpdateInput: UpdateServiceDto = {
      ...restUpdateData,
    };

    if (tourDetails !== undefined) {
      serviceUpdateInput.metadata = tourDetails || null;
    }

    return this.servicesService.updateAsEntity(id, serviceUpdateInput, userId);
  }

  async remove(id: string, userId: string): Promise<ServiceEntity> {
    await this.findOne(id);
    return this.servicesService.removeAsEntity(id, userId);
  }
}
