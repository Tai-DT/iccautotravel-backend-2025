import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateVehicleServiceInput } from './dto/create-vehicle-service.input';
import { UpdateVehicleServiceInput } from './dto/update-vehicle-service.input';
import { ServiceType } from '@prisma/client';
import { ServicesService } from '../services.service';
import { ServiceEntity, ServiceWithExtras } from '../entities/service.entity';
import { CreateServiceDto } from '../dto/create-service.dto';
import { UpdateServiceDto } from '../dto/update-service.dto';
import { DriverService } from '../driver/driver.service';
import { ServiceDriverEntity } from '../driver/entities/driver.entity';
import { GoongService } from '../../goong/goong.service';

@Injectable()
export class VehicleService {
  constructor(
    private prisma: PrismaService,
    private servicesService: ServicesService,
    private driverService: DriverService,
    private goongService: GoongService,
  ) {}

  async create(
    createVehicleServiceInput: CreateVehicleServiceInput,
    userId: string,
  ): Promise<ServiceEntity> {
    const { vehicleDetails, name, ...restBaseInput } =
      createVehicleServiceInput;

    if (name === undefined) {
      // CreateVehicleServiceInput kế thừa PartialType(CreateServiceInput)
      // nên name có thể undefined.
      throw new Error('Service name is required for vehicle creation.');
    }

    // Process driver language preferences if driver is included
    if (vehicleDetails?.driverIncluded) {
      // Find drivers based on language preferences
      const drivers = await this.findDriversByLanguage(
        vehicleDetails.englishSpeakingDriver,
        vehicleDetails.vietnameseSpeakingDriver,
      );

      // If drivers are found, include their IDs in the vehicle details
      if (drivers.length > 0) {
        vehicleDetails.driverIds = drivers.map((driver) => driver.id);
      }
    }

    // Geocode pickup and dropoff locations if they exist
    if (vehicleDetails?.pickupLocation) {
      try {
        const geocodeResult = await this.goongService.geocode(
          vehicleDetails.pickupLocation,
        );
        if (geocodeResult.results && geocodeResult.results.length > 0) {
          vehicleDetails.pickupLatitude =
            geocodeResult.results[0].geometry.location.lat;
          vehicleDetails.pickupLongitude =
            geocodeResult.results[0].geometry.location.lng;
        }
      } catch (error: unknown) {
        if (error instanceof Error) {
          console.error(`Failed to geocode pickup location: ${error.message}`);
        } else {
          console.error(`Failed to geocode pickup location: Unknown error`);
        }
        // Optionally handle error, e.g., throw or log more details
      }
    }

    if (vehicleDetails?.dropoffLocation) {
      try {
        const geocodeResult = await this.goongService.geocode(
          vehicleDetails.dropoffLocation,
        );
        if (geocodeResult.results && geocodeResult.results.length > 0) {
          vehicleDetails.dropoffLatitude =
            geocodeResult.results[0].geometry.location.lat;
          vehicleDetails.dropoffLongitude =
            geocodeResult.results[0].geometry.location.lng;
        }
      } catch (error: unknown) {
        if (error instanceof Error) {
          console.error(`Failed to geocode dropoff location: ${error.message}`);
        } else {
          console.error(`Failed to geocode dropoff location: Unknown error`);
        }
        // Optionally handle error, e.g., throw or log more details
      }
    }

    const serviceInput: CreateServiceDto = {
      ...restBaseInput,
      name,
      type: ServiceType.VEHICLE, // Fix: Use VEHICLE instead of VEHICLE_RENTAL
      metadata: vehicleDetails || null,
    };

    // Create the service
    const service = await this.servicesService.createAsEntity(
      serviceInput,
      userId,
    );

    // If driver IDs are specified, assign them to the vehicle
    if (vehicleDetails?.driverIds && vehicleDetails.driverIds.length > 0) {
      const vehicleServiceDetail =
        await this.prisma.vehicleServiceDetail.findFirst({
          where: { serviceId: service.id },
        });

      if (vehicleServiceDetail) {
        for (const driverId of vehicleDetails.driverIds) {
          try {
            await this.driverService.addDriverToVehicle(
              driverId,
              vehicleServiceDetail.id,
            );
          } catch (error: unknown) {
            if (error instanceof Error) {
              console.error(
                `Failed to assign driver ${driverId} to vehicle: ${error.message}`,
              );
            } else {
              console.error(
                `Failed to assign driver ${driverId} to vehicle: Unknown error`,
              );
            }
          }
        }
      }
    }

    return service;
  }

  async findAll(): Promise<ServiceEntity[]> {
    return this.servicesService.findAllAsEntities(ServiceType.VEHICLE);
  }

  async findOne(id: string): Promise<ServiceEntity> {
    const service = await this.servicesService.findOne(id);
    if (!service || service.type !== ServiceType.VEHICLE) {
      // Fix: Use VEHICLE instead of VEHICLE_RENTAL
      throw new NotFoundException(
        `Vehicle service with ID "${id}" not found or not of type VEHICLE`,
      );
    }
    return ServiceEntity.fromPrisma(service as unknown as ServiceWithExtras);
  }

  async update(
    id: string,
    updateVehicleServiceInput: UpdateVehicleServiceInput,
    userId: string,
  ): Promise<ServiceEntity> {
    await this.findOne(id); // Đảm bảo dịch vụ tồn tại và là VEHICLE

    const { vehicleDetails, ...restUpdateData } = updateVehicleServiceInput;

    // Geocode pickup and dropoff locations if they exist in update input
    if (vehicleDetails?.pickupLocation) {
      try {
        const geocodeResult = await this.goongService.geocode(
          vehicleDetails.pickupLocation,
        );
        if (geocodeResult.results && geocodeResult.results.length > 0) {
          vehicleDetails.pickupLatitude =
            geocodeResult.results[0].geometry.location.lat;
          vehicleDetails.pickupLongitude =
            geocodeResult.results[0].geometry.location.lng;
        }
      } catch (error: unknown) {
        if (error instanceof Error) {
          console.error(
            `Failed to geocode pickup location on update: ${error.message}`,
          );
        } else {
          console.error(
            `Failed to geocode pickup location on update: Unknown error`,
          );
        }
      }
    }

    if (vehicleDetails?.dropoffLocation) {
      try {
        const geocodeResult = await this.goongService.geocode(
          vehicleDetails.dropoffLocation,
        );
        if (geocodeResult.results && geocodeResult.results.length > 0) {
          vehicleDetails.dropoffLatitude =
            geocodeResult.results[0].geometry.location.lat;
          vehicleDetails.dropoffLongitude =
            geocodeResult.results[0].geometry.location.lng;
        }
      } catch (error: unknown) {
        if (error instanceof Error) {
          console.error(
            `Failed to geocode dropoff location on update: ${error.message}`,
          );
        } else {
          console.error(
            `Failed to geocode dropoff location on update: Unknown error`,
          );
        }
      }
    }

    // Process driver language preferences if driver is included
    if (vehicleDetails?.driverIncluded) {
      // Find drivers based on language preferences
      const drivers = await this.findDriversByLanguage(
        vehicleDetails.englishSpeakingDriver,
        vehicleDetails.vietnameseSpeakingDriver,
      );

      // If drivers are found, include their IDs in the vehicle details
      if (drivers.length > 0) {
        vehicleDetails.driverIds = drivers.map((driver) => driver.id);
      }
    }

    const serviceUpdateInput: UpdateServiceDto = {
      ...restUpdateData,
    };

    if (vehicleDetails !== undefined) {
      serviceUpdateInput.metadata = vehicleDetails || null;
    }

    // Update the service
    const service = await this.servicesService.updateAsEntity(
      id,
      serviceUpdateInput,
      userId,
    );

    // If driver IDs are specified, update the vehicle's drivers
    if (vehicleDetails?.driverIds) {
      const vehicleServiceDetail =
        await this.prisma.vehicleServiceDetail.findFirst({
          where: { serviceId: id },
          include: {},
        });

      if (vehicleServiceDetail) {
        try {
          // Remove all existing drivers
          // Access drivers directly
          const drivers = await this.getDriversForVehicle(
            vehicleServiceDetail.id,
          );
          for (const driver of drivers) {
            try {
              await this.driverService.removeDriverFromVehicle(
                driver.id,
                vehicleServiceDetail.id,
              );
            } catch (error: unknown) {
              if (error instanceof Error) {
                console.error(
                  `Failed to remove driver ${driver.id} from vehicle: ${error.message}`,
                );
              } else {
                console.error(
                  `Failed to remove driver ${driver.id} from vehicle: Unknown error`,
                );
              }
            }
          }

          // Add new drivers
          for (const driverId of vehicleDetails.driverIds) {
            try {
              await this.driverService.addDriverToVehicle(
                driverId,
                vehicleServiceDetail.id,
              );
            } catch (error: unknown) {
              if (error instanceof Error) {
                console.error(
                  `Failed to assign driver ${driverId} to vehicle: ${error.message}`,
                );
              } else {
                console.error(
                  `Failed to assign driver ${driverId} to vehicle: Unknown error`,
                );
              }
            }
          }
        } catch (error: unknown) {
          if (error instanceof Error) {
            console.error('Error updating vehicle drivers:', error.message);
          } else {
            console.error('Error updating vehicle drivers: Unknown error');
          }
          // Continue to return the service even if updating drivers failed
        }
      }
    }

    return service;
  }

  async remove(id: string, userId: string): Promise<ServiceEntity> {
    await this.findOne(id);
    return this.servicesService.removeAsEntity(id, userId);
  }

  async findDriversByLanguage(
    speaksEnglish?: boolean,
    speaksVietnamese?: boolean,
  ): Promise<ServiceDriverEntity[]> {
    const drivers = await this.driverService.findByLanguage(
      speaksEnglish,
      speaksVietnamese,
    );
    // Convert driver entities to include the required 'name' field
    return drivers.map((driver) => ({
      ...driver,
      name: `Driver ${driver.id.substring(0, 8)}`, // Add name property
    }));
  }

  async getAvailableDriversForVehicle(
    vehicleId: string,
  ): Promise<ServiceDriverEntity[]> {
    // Kiểm tra xem chi tiết dịch vụ xe tồn tại không
    const vehicleServiceDetail =
      await this.prisma.vehicleServiceDetail.findFirst({
        where: { serviceId: vehicleId },
      });

    if (!vehicleServiceDetail) {
      throw new NotFoundException(
        `Vehicle service detail for vehicle ID "${vehicleId}" not found`,
      );
    }

    // Get driver data through a separate query
    const driverIds = await this.prisma.$queryRaw<{ driverId: string }[]>`
      SELECT "driverId" FROM "VehicleDriver" WHERE "vehicleServiceDetailId" = ${vehicleServiceDetail.id}
    `;

    if (!driverIds || driverIds.length === 0) {
      return [];
    }

    const driverData = await Promise.all(
      driverIds.map(
        ({ driverId }) => this.prisma.$queryRaw<any[]>`
        SELECT * FROM "Driver" WHERE id = ${driverId}
      `,
      ),
    );

    return driverData
      .filter((data) => Array.isArray(data) && data.length > 0)
      .map((data) => ServiceDriverEntity.fromPrisma(data[0]));
  }

  async assignDriverToVehicle(
    vehicleId: string,
    driverId: string,
  ): Promise<ServiceEntity> {
    const vehicleServiceDetail =
      await this.prisma.vehicleServiceDetail.findFirst({
        where: { serviceId: vehicleId },
      });

    if (!vehicleServiceDetail) {
      throw new NotFoundException(
        `Vehicle service detail for vehicle ID "${vehicleId}" not found`,
      );
    }

    await this.driverService.addDriverToVehicle(
      driverId,
      vehicleServiceDetail.id,
    );
    return this.findOne(vehicleId);
  }

  async removeDriverFromVehicleService(
    vehicleId: string,
    driverId: string,
  ): Promise<ServiceEntity> {
    const vehicleServiceDetail =
      await this.prisma.vehicleServiceDetail.findFirst({
        where: { serviceId: vehicleId },
      });

    if (!vehicleServiceDetail) {
      throw new NotFoundException(
        `Vehicle service detail for vehicle ID "${vehicleId}" not found`,
      );
    }

    await this.driverService.removeDriverFromVehicle(
      driverId,
      vehicleServiceDetail.id,
    );
    return this.findOne(vehicleId);
  }

  async getVehicleWithDrivers(vehicleId: string) {
    // Sử dụng SQL thuần thay vì truy cập trực tiếp vào vehicleDrivers
    const vehicleServiceDetail =
      await this.prisma.vehicleServiceDetail.findUnique({
        where: { id: vehicleId },
        include: {},
      });

    if (!vehicleServiceDetail) {
      throw new NotFoundException(
        `Vehicle detail with ID ${vehicleId} not found`,
      );
    }

    // Lấy danh sách tài xế gắn với xe
    const drivers = await this.prisma.$queryRaw`
      SELECT d.* 
      FROM "Driver" d
      JOIN "VehicleDriver" vd ON d.id = vd."driverId"
      WHERE vd."vehicleServiceDetailId" = ${vehicleId}
    `;

    return {
      ...vehicleServiceDetail,
      drivers: Array.isArray(drivers)
        ? drivers.map((driver: any) => ServiceDriverEntity.fromPrisma(driver))
        : [],
    };
  }

  async getDriversForVehicle(vehicleId: string) {
    // Kiểm tra xem xe có tồn tại không
    const vehicleServiceDetail =
      await this.prisma.vehicleServiceDetail.findUnique({
        where: { id: vehicleId },
      });

    if (!vehicleServiceDetail) {
      throw new NotFoundException(`Vehicle with ID ${vehicleId} not found`);
    }

    // Lấy danh sách tài xế gắn với xe
    const drivers = await this.prisma.$queryRaw`
      SELECT d.* 
      FROM "Driver" d
      JOIN "VehicleDriver" vd ON d.id = vd."driverId"
      WHERE vd."vehicleServiceDetailId" = ${vehicleId}
    `;

    return Array.isArray(drivers)
      ? drivers.map((vd: any) => ServiceDriverEntity.fromPrisma(vd))
      : [];
  }
}
