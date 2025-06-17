import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateFastTrackServiceInput } from './dto/create-fast-track-service.input';
import { UpdateFastTrackServiceInput } from './dto/update-fast-track-service.input';
import { ServiceType } from '@prisma/client';
import { ServicesService } from '../services.service';
import { ServiceEntity, ServiceWithExtras } from '../entities/service.entity';
import { CreateServiceInput } from '../dto/create-service.input';
import { UpdateServiceInput } from '../dto/update-service.input';

@Injectable()
export class FastTrackService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly servicesService: ServicesService,
  ) {}

  async create(
    createFastTrackServiceInput: CreateFastTrackServiceInput,
    userId: string,
  ): Promise<ServiceEntity> {
    const { fastTrackDetails, name, ...restBaseInput } =
      createFastTrackServiceInput;

    if (name === undefined) {
      throw new Error('Service name is required for fast track creation.');
    }

    const serviceInput: CreateServiceInput = {
      ...restBaseInput,
      name,
      type: ServiceType.FAST_TRACK, // This is correct as per schema
      metadata: fastTrackDetails || null,
    };
    return this.servicesService.createAsEntity(serviceInput, userId);
  }

  async findAll() {
    const result = await this.servicesService.findAllByType(
      ServiceType.FAST_TRACK,
    );
    return result.data;
  }

  async findOne(id: string): Promise<ServiceEntity> {
    const service = await this.prisma.service.findUnique({
      where: { id },
    });

    if (!service || service.type !== ServiceType.FAST_TRACK) {
      throw new Error(`Fast track service with ID "${id}" not found`);
    }

    return ServiceEntity.fromPrisma(service);
  }

  async update(
    id: string,
    updateFastTrackServiceInput: UpdateFastTrackServiceInput,
    userId: string,
  ): Promise<ServiceEntity> {
    await this.findOne(id);

    const { fastTrackDetails, ...restUpdateData } = updateFastTrackServiceInput;

    const serviceUpdateInput: UpdateServiceInput = {
      ...restUpdateData,
    };

    if (fastTrackDetails !== undefined) {
      serviceUpdateInput.metadata = fastTrackDetails || null;
    }

    return this.servicesService.updateAsEntity(id, serviceUpdateInput, userId);
  }

  async remove(id: string, userId: string): Promise<ServiceEntity> {
    await this.findOne(id);
    return this.servicesService.removeAsEntity(id, userId);
  }
}
