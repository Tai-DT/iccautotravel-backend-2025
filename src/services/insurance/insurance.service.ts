import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ServiceType } from '@prisma/client';
import { CreateInsuranceServiceInput } from './dto/create-insurance-service.input';
import { UpdateInsuranceServiceInput } from './dto/update-insurance-service.input';
import { ServicesService } from '../services.service';
import { ServiceEntity, ServiceWithExtras } from '../entities/service.entity';
import { CreateServiceInput } from '../dto/create-service.input';
import { UpdateServiceInput } from '../dto/update-service.input';

@Injectable()
export class InsuranceService {
  constructor(
    private prisma: PrismaService, // Giữ lại PrismaService nếu cần cho các logic phức tạp hơn sau này
    private servicesService: ServicesService,
  ) {}

  async create(
    createInsuranceServiceInput: CreateInsuranceServiceInput,
    userId: string,
  ): Promise<ServiceEntity> {
    const { insuranceDetails, name, ...restBaseInput } =
      createInsuranceServiceInput;

    // Đảm bảo 'name' được truyền và không phải là undefined
    if (name === undefined) {
      throw new Error('Service name is required for creation.');
    }

    const serviceInput: CreateServiceInput = {
      ...restBaseInput,
      name, // name đã được đảm bảo là string
      type: ServiceType.INSURANCE,
      metadata: insuranceDetails || null, // Truyền insuranceDetails làm metadata
    };
    return this.servicesService.createAsEntity(serviceInput, userId);
  }

  findAll(): Promise<ServiceEntity[]> {
    return this.servicesService.findAllAsEntities(ServiceType.INSURANCE);
  }

  async findOne(id: string): Promise<ServiceEntity> {
    const service = await this.servicesService.findOne(id);
    if (!service || service.type !== ServiceType.INSURANCE) {
      throw new NotFoundException(
        `Insurance service with ID "${id}" not found or not of type INSURANCE`,
      );
    }
    return ServiceEntity.fromPrisma(service as unknown as ServiceWithExtras);
  }

  async update(
    id: string,
    updateInsuranceServiceInput: UpdateInsuranceServiceInput,
    userId: string,
  ): Promise<ServiceEntity> {
    // Đảm bảo dịch vụ tồn tại và thuộc loại INSURANCE trước khi cập nhật
    await this.findOne(id);

    const { insuranceDetails, ...restUpdateData } = updateInsuranceServiceInput;

    const serviceUpdateInput: UpdateServiceInput = {
      ...restUpdateData,
    };

    // Chỉ cập nhật metadata nếu insuranceDetails được cung cấp (có thể là null)
    if (insuranceDetails !== undefined) {
      serviceUpdateInput.metadata = insuranceDetails || null;
    }

    return this.servicesService.updateAsEntity(id, serviceUpdateInput, userId);
  }

  async remove(id: string, userId: string): Promise<ServiceEntity> {
    // Đảm bảo dịch vụ tồn tại và thuộc loại INSURANCE trước khi xóa
    await this.findOne(id);
    return this.servicesService.removeAsEntity(id, userId);
  }
}
