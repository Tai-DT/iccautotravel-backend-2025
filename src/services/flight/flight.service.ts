import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateFlightServiceInput } from './dto/create-flight-service.input';
import { UpdateFlightServiceInput } from './dto/update-flight-service.input';
import { ServiceType } from '@prisma/client';
import { ServicesService } from '../services.service';
import { ServiceEntity, ServiceWithExtras } from '../entities/service.entity';
import { CreateServiceInput } from '../dto/create-service.input';
import { UpdateServiceInput } from '../dto/update-service.input';

@Injectable()
export class FlightService {
  constructor(
    private prisma: PrismaService,
    private servicesService: ServicesService,
  ) {}

  async create(
    createFlightServiceInput: CreateFlightServiceInput,
    userId: string,
  ): Promise<ServiceEntity> {
    const { flightDetails, name, ...restBaseInput } = createFlightServiceInput;

    if (name === undefined) {
      throw new Error('Service name is required for flight creation.');
    }

    const serviceInput: CreateServiceInput = {
      ...restBaseInput,
      name: name, // name is checked for undefined above, non-null assertion removed
      type: ServiceType.FLIGHT,
      metadata: flightDetails || null,
    };
    const service = await this.servicesService.createAsEntity(
      serviceInput,
      userId,
    );
    return service;
  }

  async findAll(): Promise<ServiceEntity[]> {
    return this.servicesService.findAllAsEntities(ServiceType.FLIGHT);
  }

  async findOne(id: string): Promise<ServiceEntity> {
    const service = await this.servicesService.findOneAsEntity(id);
    if (!service || service.type !== ServiceType.FLIGHT) {
      throw new NotFoundException(
        `Flight service with ID "${id}" not found or not of type FLIGHT`,
      );
    }
    return service;
  }

  async update(
    id: string,
    updateFlightServiceInput: UpdateFlightServiceInput,
    userId: string,
  ): Promise<ServiceEntity> {
    await this.findOne(id); // Ensures the service exists and is of type FLIGHT

    const { flightDetails, ...restUpdateData } = updateFlightServiceInput;

    const serviceUpdateInput: UpdateServiceInput = {
      ...restUpdateData,
    };

    // Only update metadata if flightDetails is explicitly provided
    if (flightDetails !== undefined) {
      serviceUpdateInput.metadata = flightDetails || null;
    }

    const service = await this.servicesService.update(
      id,
      serviceUpdateInput,
      userId,
    );
    return ServiceEntity.fromPrisma(service as unknown as ServiceWithExtras);
  }

  async remove(id: string, userId: string): Promise<ServiceEntity> {
    await this.findOne(id); // Ensures the service exists and is of type FLIGHT
    const service = await this.servicesService.remove(id, userId);
    return ServiceEntity.fromPrisma(service as unknown as ServiceWithExtras);
  }
}
