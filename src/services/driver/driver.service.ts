import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ServiceDriverEntity } from './entities/driver.entity';
import { CreateDriverDto, UpdateDriverDto } from './dto';
import { v4 } from 'uuid';
import { Prisma, User, Role, DriverApprovalStatus } from '@prisma/client';

@Injectable()
export class DriverService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDriverDto: CreateDriverDto): Promise<ServiceDriverEntity> {
    try {
      // Kiểm tra xem người dùng có tồn tại không
      const user = await this.prisma.user.findUnique({
        where: { id: createDriverDto.userId },
      });

      if (!user) {
        throw new NotFoundException(
          `Không tìm thấy người dùng với ID: ${createDriverDto.userId}`,
        );
      }

      // Cập nhật thông tin tài xế vào người dùng hiện có
      const updatedUser = await this.prisma.user.update({
        where: { id: createDriverDto.userId },
        data: {
          licenseNumber: createDriverDto.licenseNumber,
          licenseClass: createDriverDto.licenseClass,
          licenseExpiry: createDriverDto.licenseExpiry,
          experience: createDriverDto.experience || 0,
          bio: createDriverDto.bio || null,
          languages: createDriverDto.languages || [],
          driverStatus: createDriverDto.status
            ? (createDriverDto.status as DriverApprovalStatus)
            : DriverApprovalStatus.PENDING,
          updatedAt: new Date(),
          isActive: true,
          Role: {
            connect: { name: 'STAFF' },
          }, // Gán vai trò STAFF cho tài xế
        },
      });

      return ServiceDriverEntity.fromPrisma(updatedUser);
    } catch (error) {
      console.error('Error creating driver:', error);
      throw new InternalServerErrorException('Failed to create driver');
    }
  }

  async findAll() {
    try {
      const drivers = await this.prisma.user.findMany({
        where: { isActive: true, Role: { name: 'STAFF' } }, // Chỉ lấy người dùng có vai trò STAFF (tài xế)
      });

      return drivers.map((user: User) => ServiceDriverEntity.fromPrisma(user));
    } catch (error) {
      console.error('Error finding all drivers:', error);
      throw new InternalServerErrorException('Failed to retrieve drivers');
    }
  }

  async findByLanguage(speaksEnglish?: boolean, speaksVietnamese?: boolean) {
    try {
      const conditions: Prisma.UserWhereInput = {
        isActive: true,
        Role: { name: 'STAFF' },
      };

      if (speaksEnglish || speaksVietnamese) {
        conditions.languages = {
          hasSome: [
            ...(speaksEnglish ? ['English'] : []),
            ...(speaksVietnamese ? ['Vietnamese'] : []),
          ],
        };
      }

      const drivers = await this.prisma.user.findMany({
        where: conditions,
      });

      return drivers.map((user: User) => ServiceDriverEntity.fromPrisma(user));
    } catch (error) {
      console.error('Error finding drivers by language:', error);
      throw new InternalServerErrorException(
        'Failed to retrieve drivers by language',
      );
    }
  }

  async addDriverToVehicle(driverId: string, vehicleServiceDetailId: string) {
    try {
      const driverExists = await this.prisma.user.findUnique({
        where: { id: driverId, Role: { name: 'STAFF' } },
      });

      if (!driverExists) {
        throw new NotFoundException(`Driver with ID ${driverId} not found`);
      }

      const vehicleExists = await this.prisma.vehicleServiceDetail.findUnique({
        where: { id: vehicleServiceDetailId },
      });

      if (!vehicleExists) {
        throw new NotFoundException(
          `Vehicle with ID ${vehicleServiceDetailId} not found`,
        );
      }

      // Logic gán tài xế cho xe cần được xem xét lại vì không có model VehicleDriver
      // Tạm thời bỏ qua hoặc cần một cách khác để lưu trữ mối quan hệ này
      // Ví dụ: thêm một trường vehicleId vào User model hoặc một bảng liên kết mới
      // Hiện tại, tôi sẽ không thực hiện thay đổi nào ở đây và sẽ để lại lỗi để xử lý sau.
      // Nếu VehicleDriver là một model đã bị xóa, thì logic này cần được loại bỏ hoặc thay thế.
      // Để tiếp tục, tôi sẽ comment out phần này.
      /*
      // Logic gán tài xế cho xe cần được xem xét lại vì không có model VehicleDriver
      // Tạm thời bỏ qua hoặc cần một cách khác để lưu trữ mối quan hệ này
      // Ví dụ: thêm một trường vehicleId vào User model hoặc một bảng liên kết mới
      // Hiện tại, tôi sẽ không thực hiện thay đổi nào ở đây và sẽ để lại lỗi để xử lý sau.
      // Nếu VehicleDriver là một model đã bị xóa, thì logic này cần được loại bỏ hoặc thay thế.
      // Để tiếp tục, tôi sẽ comment out phần này.
      /*
      await this.prisma.vehicleDriver.upsert({
        where: {
          driverId_vehicleServiceDetailId: {
            driverId,
            vehicleServiceDetailId,
          },
        },
        create: {
          id: v4(),
          driverId,
          vehicleServiceDetailId,
          isDefault: false,
          assignedAt: new Date(),
        },
        update: {},
      });
      */
      throw new InternalServerErrorException(
        'Chức năng gán tài xế cho xe chưa được triển khai theo schema mới.',
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error adding driver to vehicle:', error);
      throw new InternalServerErrorException('Failed to add driver to vehicle');
    }
  }

  async removeDriverFromVehicle(
    driverId: string,
    vehicleServiceDetailId: string,
  ) {
    try {
      // Tương tự, chức năng này cần được xem xét lại.
      /*
      const vehicleDriverExists = await this.prisma.vehicleDriver.findUnique({
        where: {
          driverId_vehicleServiceDetailId: {
            driverId,
            vehicleServiceDetailId,
          },
        },
      });

      if (!vehicleDriverExists) {
        return true;
      }

      await this.prisma.vehicleDriver.delete({
        where: {
          driverId_vehicleServiceDetailId: {
            driverId,
            vehicleServiceDetailId,
          },
        },
      });
      */
      throw new InternalServerErrorException(
        'Chức năng hủy gán tài xế khỏi xe chưa được triển khai theo schema mới.',
      );
    } catch (error) {
      console.error('Error removing driver from vehicle:', error);
      throw new InternalServerErrorException(
        'Failed to remove driver from vehicle',
      );
    }
  }

  async findOne(id: string) {
    try {
      if (!id) {
        throw new NotFoundException('Driver ID is required');
      }

      const driver = await this.prisma.user.findUnique({
        where: { id, Role: { name: 'STAFF' } },
      });

      if (!driver) {
        throw new NotFoundException(`Driver with ID ${id} not found`);
      }

      return ServiceDriverEntity.fromPrisma(driver);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error(`Error finding driver with ID ${id}:`, error);
      throw new InternalServerErrorException('Failed to retrieve driver');
    }
  }

  async update(id: string, updateDriverDto: UpdateDriverDto) {
    try {
      if (!id) {
        throw new NotFoundException('Driver ID is required');
      }

      const existingDriver = await this.prisma.user.findUnique({
        where: { id, Role: { name: 'STAFF' } },
      });

      if (!existingDriver) {
        throw new NotFoundException(`Driver with ID ${id} not found`);
      }

      // Create a properly structured update data object with only valid fields
      const updateData: Prisma.UserUpdateInput = {
        updatedAt: new Date(),
      };

      // Only include fields that exist in the updateDriverDto
      if (updateDriverDto.licenseNumber !== undefined)
        updateData.licenseNumber = updateDriverDto.licenseNumber;
      if (updateDriverDto.licenseClass !== undefined)
        updateData.licenseClass = updateDriverDto.licenseClass;
      if (updateDriverDto.licenseExpiry !== undefined)
        updateData.licenseExpiry = updateDriverDto.licenseExpiry;
      if (updateDriverDto.experience !== undefined)
        updateData.experience = updateDriverDto.experience;
      if (updateDriverDto.bio !== undefined)
        updateData.bio = updateDriverDto.bio;
      if (updateDriverDto.languages !== undefined)
        updateData.languages = updateDriverDto.languages;
      if (updateDriverDto.isActive !== undefined)
        updateData.isActive = updateDriverDto.isActive;
      if (updateDriverDto.status !== undefined)
        updateData.driverStatus =
          updateDriverDto.status as DriverApprovalStatus;

      // userId đã là khóa chính, không cần connect
      // Các trường khác đã được thêm vào User model
      if (updateDriverDto.userId !== undefined) {
        updateData.id = updateDriverDto.userId; // Cập nhật ID nếu cần, mặc dù thường không thay đổi ID
      }

      const updatedDriver = await this.prisma.user.update({
        where: { id },
        data: updateData,
      });

      return ServiceDriverEntity.fromPrisma(updatedDriver);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error(`Error updating driver with ID ${id}:`, error);
      throw new InternalServerErrorException('Failed to update driver');
    }
  }

  async remove(id: string) {
    try {
      if (!id) {
        throw new NotFoundException('Driver ID is required');
      }

      const existingDriver = await this.prisma.user.findUnique({
        where: { id, Role: { name: 'STAFF' } },
      });

      if (!existingDriver) {
        throw new NotFoundException(`Driver with ID ${id} not found`);
      }

      const deletedDriver = await this.prisma.user.update({
        where: { id },
        data: {
          isActive: false,
          updatedAt: new Date(),
          driverStatus: DriverApprovalStatus.REJECTED, // Đặt trạng thái tài xế là REJECTED khi xóa
        },
      });

      return ServiceDriverEntity.fromPrisma(deletedDriver);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error(`Error removing driver with ID ${id}:`, error);
      throw new InternalServerErrorException('Failed to remove driver');
    }
  }

  async assignVehicle(driverId: string, vehicleId: string) {
    try {
      const driverExists = await this.prisma.user.findUnique({
        where: { id: driverId, Role: { name: 'STAFF' } },
      });

      if (!driverExists) {
        throw new NotFoundException(`Driver with ID ${driverId} not found`);
      }

      const vehicleExists = await this.prisma.vehicleServiceDetail.findUnique({
        where: { id: vehicleId },
      });

      if (!vehicleExists) {
        throw new NotFoundException(`Vehicle with ID ${vehicleId} not found`);
      }

      // Tương tự, chức năng này cần được xem xét lại.
      /*
      await this.prisma.vehicleDriver.upsert({
        where: {
          driverId_vehicleServiceDetailId: {
            driverId,
            vehicleServiceDetailId: vehicleId,
          },
        },
        create: {
          id: v4(),
          driverId,
          vehicleServiceDetailId: vehicleId,
          isDefault: true,
          assignedAt: new Date(),
        },
        update: {
          isDefault: true,
          assignedAt: new Date(),
        },
      });
      */
      throw new InternalServerErrorException(
        'Chức năng gán xe cho tài xế chưa được triển khai theo schema mới.',
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error assigning vehicle to driver:', error);
      throw new InternalServerErrorException(
        'Failed to assign vehicle to driver',
      );
    }
  }

  async unassignVehicle(driverId: string, vehicleId: string) {
    try {
      // Tương tự, chức năng này cần được xem xét lại.
      /*
      const vehicleDriverExists = await this.prisma.vehicleDriver.findUnique({
        where: {
          driverId_vehicleServiceDetailId: {
            driverId,
            vehicleServiceDetailId: vehicleId,
          },
        },
      });

      if (!vehicleDriverExists) {
        return {
          success: true,
          message: 'Vehicle was not assigned to this driver',
        };
      }

      await this.prisma.vehicleDriver.delete({
        where: {
          driverId_vehicleServiceDetailId: {
            driverId,
            vehicleServiceDetailId: vehicleId,
          },
        },
      });
      */
      throw new InternalServerErrorException(
        'Chức năng hủy gán xe khỏi tài xế chưa được triển khai theo schema mới.',
      );
    } catch (error) {
      console.error('Error unassigning vehicle from driver:', error);
      throw new InternalServerErrorException(
        'Failed to unassign vehicle from driver',
      );
    }
  }
}
