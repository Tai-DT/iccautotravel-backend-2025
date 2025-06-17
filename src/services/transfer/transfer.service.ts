import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ServiceType } from '@prisma/client';
import { CreateTransferServiceInput } from './dto/create-transfer-service.input';
import { UpdateTransferServiceInput } from './dto/update-transfer-service.input';
import { ServicesService } from '../services.service';
import { ServiceEntity, ServiceWithExtras } from '../entities/service.entity';
import { CreateServiceInput } from '../dto/create-service.input';
import { UpdateServiceInput } from '../dto/update-service.input';

@Injectable()
export class TransferService {
  constructor(
    private prisma: PrismaService,
    private servicesService: ServicesService,
  ) {}

  async create(
    createTransferServiceInput: CreateTransferServiceInput,
    userId: string,
  ): Promise<ServiceEntity> {
    const { transferDetails, name, ...restBaseInput } =
      createTransferServiceInput;

    if (name === undefined) {
      throw new Error('Service name is required for creation.');
    }

    const serviceInput: CreateServiceInput = {
      ...restBaseInput,
      name,
      type: ServiceType.TRANSFER,
      metadata: transferDetails || null,
    };
    return this.servicesService.createAsEntity(serviceInput, userId);
  }

  findAll(): Promise<ServiceEntity[]> {
    return this.servicesService.findAllAsEntities(ServiceType.TRANSFER);
  }

  async findOne(id: string): Promise<ServiceEntity> {
    const service = await this.servicesService.findOne(id);
    if (!service || service.type !== ServiceType.TRANSFER) {
      throw new NotFoundException(
        `Transfer service with ID "${id}" not found or not of type TRANSFER`,
      );
    }
    return ServiceEntity.fromPrisma(service as unknown as ServiceWithExtras);
  }

  async update(
    id: string,
    updateTransferServiceInput: UpdateTransferServiceInput,
    userId: string,
  ): Promise<ServiceEntity> {
    await this.findOne(id);

    const { transferDetails, ...restUpdateData } = updateTransferServiceInput;

    const serviceUpdateInput: UpdateServiceInput = {
      ...restUpdateData,
    };

    if (transferDetails !== undefined) {
      serviceUpdateInput.metadata = transferDetails || null;
    }

    return this.servicesService.updateAsEntity(id, serviceUpdateInput, userId);
  }

  async remove(id: string, userId: string): Promise<ServiceEntity> {
    await this.findOne(id);
    return this.servicesService.removeAsEntity(id, userId);
  }
}
