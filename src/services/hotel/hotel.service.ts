import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateHotelServiceInput } from './dto/create-hotel-service.input';
import { UpdateHotelServiceInput } from './dto/update-hotel-service.input';
import { ServiceType } from '@prisma/client';
import { ServicesService } from '../services.service';
import { ServiceEntity, ServiceWithExtras } from '../entities/service.entity';
import { CreateServiceDto } from '../dto/create-service.dto';
import { UpdateServiceDto } from '../dto/update-service.dto';

@Injectable()
export class HotelService {
  constructor(
    private prisma: PrismaService,
    private servicesService: ServicesService,
  ) {}

  async create(
    createHotelServiceInput: CreateHotelServiceInput,
    userId: string,
  ): Promise<ServiceEntity> {
    const { hotelDetails, name, ...restBaseInput } = createHotelServiceInput;

    if (name === undefined) {
      throw new Error('Service name is required for hotel creation.');
    }

    const serviceInput: CreateServiceDto = {
      ...restBaseInput,
      name,
      type: ServiceType.HOTEL,
      metadata: hotelDetails || null,
    };
    return this.servicesService.createAsEntity(serviceInput, userId);
  }

  async findAll(): Promise<ServiceEntity[]> {
    return this.servicesService.findAllAsEntities(ServiceType.HOTEL);
  }

  async findOne(id: string): Promise<ServiceEntity> {
    const service = await this.servicesService.findOne(id);
    if (!service || service.type !== ServiceType.HOTEL) {
      throw new NotFoundException(
        `Hotel service with ID "${id}" not found or not of type HOTEL`,
      );
    }
    return ServiceEntity.fromPrisma(service as unknown as ServiceWithExtras);
  }

  async update(
    id: string,
    updateHotelServiceInput: UpdateHotelServiceInput,
    userId: string,
  ): Promise<ServiceEntity> {
    await this.findOne(id);

    const { hotelDetails, ...restUpdateData } = updateHotelServiceInput;

    const serviceUpdateInput: UpdateServiceDto = {
      ...restUpdateData,
    };

    if (hotelDetails !== undefined) {
      serviceUpdateInput.metadata = hotelDetails || null;
    }

    return this.servicesService.updateAsEntity(id, serviceUpdateInput, userId);
  }

  async remove(id: string, userId: string): Promise<ServiceEntity> {
    await this.findOne(id);
    return this.servicesService.removeAsEntity(id, userId);
  }
}
