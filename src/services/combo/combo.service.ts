import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateComboServiceInput } from './dto/create-combo-service.input';
import { UpdateComboServiceInput } from './dto/update-combo-service.input';
import { ServiceType } from '@prisma/client';
import { ServicesService } from '../services.service';
import { ServiceEntity, ServiceWithExtras } from '../entities/service.entity';
import { CreateServiceInput } from '../dto/create-service.input';
import { UpdateServiceInput } from '../dto/update-service.input';

@Injectable()
export class ComboService {
  constructor(
    private prisma: PrismaService,
    private servicesService: ServicesService,
  ) {}

  async create(
    createComboServiceInput: CreateComboServiceInput,
    userId: string,
  ): Promise<ServiceEntity> {
    const { comboDetails, name, ...restBaseInput } = createComboServiceInput;

    if (name === undefined) {
      throw new Error('Service name is required for combo creation.');
    }

    const serviceInput: CreateServiceInput = {
      ...restBaseInput,
      name,
      type: ServiceType.COMBO,
      metadata: comboDetails || null,
    };
    return this.servicesService.createAsEntity(serviceInput, userId);
  }

  async findAll() {
    const services = await this.prisma.service.findMany({
      where: {
        type: ServiceType.COMBO,
        isActive: true,
        isDeleted: false,
      },
    });

    return {
      data: services.map((service) => ServiceEntity.fromPrisma(service)),
      metadata: {
        total: services.length,
      },
    };
  }

  async findOne(id: string): Promise<ServiceEntity> {
    const service = await this.prisma.service.findUnique({
      where: { id },
    });

    if (!service || service.type !== ServiceType.COMBO) {
      throw new NotFoundException(
        `Combo service with ID "${id}" not found or not of type COMBO`,
      );
    }

    return ServiceEntity.fromPrisma(service);
  }

  async update(
    id: string,
    updateComboServiceInput: UpdateComboServiceInput,
    userId: string,
  ): Promise<ServiceEntity> {
    await this.findOne(id);

    const { comboDetails, ...restUpdateData } = updateComboServiceInput;

    const serviceUpdateInput: UpdateServiceInput = {
      ...restUpdateData,
    };

    if (comboDetails !== undefined) {
      serviceUpdateInput.metadata = comboDetails || null;
    }

    return this.servicesService.updateAsEntity(id, serviceUpdateInput, userId);
  }

  async remove(id: string, userId: string): Promise<ServiceEntity> {
    await this.findOne(id);
    return this.servicesService.removeAsEntity(id, userId);
  }
}
