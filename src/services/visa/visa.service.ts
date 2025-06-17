import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateVisaServiceInput } from './dto/create-visa-service.input';
import { UpdateVisaServiceInput } from './dto/update-visa-service.input';
import { ServiceType } from '@prisma/client';
import { ServicesService } from '../services.service';
import { ServiceEntity, ServiceWithExtras } from '../entities/service.entity';
import { CreateServiceDto } from '../dto/create-service.dto';
import { UpdateServiceDto } from '../dto/update-service.dto';

@Injectable()
export class VisaService {
  constructor(
    private prisma: PrismaService,
    private servicesService: ServicesService,
  ) {}

  async create(
    createVisaServiceInput: CreateVisaServiceInput,
    userId: string,
  ): Promise<ServiceEntity> {
    const { visaDetails, name, ...restBaseInput } = createVisaServiceInput;

    if (name === undefined) {
      throw new Error('Service name is required for visa creation.');
    }

    const serviceInput: CreateServiceDto = {
      ...restBaseInput,
      name,
      type: ServiceType.VISA,
      metadata: visaDetails || null,
    };
    return this.servicesService.createAsEntity(serviceInput, userId);
  }

  async findAll(): Promise<ServiceEntity[]> {
    return this.servicesService.findAllAsEntities(ServiceType.VISA);
  }

  async findOne(id: string): Promise<ServiceEntity> {
    const service = await this.servicesService.findOne(id);
    if (!service || service.type !== ServiceType.VISA) {
      throw new NotFoundException(
        `Visa service with ID "${id}" not found or not of type VISA`,
      );
    }
    return ServiceEntity.fromPrisma(service as unknown as ServiceWithExtras);
  }

  async update(
    id: string,
    updateVisaServiceInput: UpdateVisaServiceInput,
    userId: string,
  ): Promise<ServiceEntity> {
    await this.findOne(id);

    const { visaDetails, ...restUpdateData } = updateVisaServiceInput;

    const serviceUpdateInput: UpdateServiceDto = {
      ...restUpdateData,
    };

    if (visaDetails !== undefined) {
      serviceUpdateInput.metadata = visaDetails || null;
    }

    return this.servicesService.updateAsEntity(id, serviceUpdateInput, userId);
  }

  async remove(id: string, userId: string): Promise<ServiceEntity> {
    await this.findOne(id);
    return this.servicesService.removeAsEntity(id, userId);
  }
}
