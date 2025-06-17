import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { DriverService } from './driver.service';
import { ServiceDriverEntity } from './entities/driver.entity';
import { CreateDriverInput } from './dto/create-driver.input';
import { CreateDriverDto } from './dto/create-driver.dto'; // Import lại CreateDriverDto
import { UpdateDriverInput } from './dto/update-driver.input';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Resolver(() => ServiceDriverEntity)
export class DriverResolver {
  constructor(private readonly driverService: DriverService) {}

  @Mutation(() => ServiceDriverEntity)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF')
  createDriver(
    @Args('input') createDriverInput: CreateDriverInput,
  ): Promise<ServiceDriverEntity> {
    // Convert CreateDriverInput to CreateDriverDto
    const driverDto = new CreateDriverDto();
    driverDto.fullName = createDriverInput.fullName;
    driverDto.phone = createDriverInput.phone;
    driverDto.email = createDriverInput.email;
    driverDto.licenseNumber = createDriverInput.licenseNumber;
    driverDto.licenseExpiry = createDriverInput.licenseExpiry;
    driverDto.experience = createDriverInput.experienceYears || 0;
    driverDto.bio = createDriverInput.notes || '';
    driverDto.licenseClass = 'B2'; // Giá trị mặc định, không có trong input
    driverDto.userId = ''; // Sẽ được lấy từ auth context hoặc truyền riêng

    const languages: string[] = [];
    if (createDriverInput.speaksEnglish) languages.push('English');
    if (createDriverInput.speaksVietnamese) languages.push('Vietnamese');
    driverDto.languages = languages;

    return this.driverService.create(driverDto);
  }

  @Query(() => [ServiceDriverEntity], { name: 'drivers' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF')
  findAll(): Promise<ServiceDriverEntity[]> {
    return this.driverService.findAll();
  }

  @Query(() => ServiceDriverEntity, { name: 'driver' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF')
  findOne(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<ServiceDriverEntity> {
    return this.driverService.findOne(id);
  }

  @Mutation(() => ServiceDriverEntity)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF')
  updateDriver(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') updateDriverInput: UpdateDriverInput,
  ): Promise<ServiceDriverEntity> {
    return this.driverService.update(id, updateDriverInput);
  }

  @Mutation(() => ServiceDriverEntity)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF')
  removeDriver(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<ServiceDriverEntity> {
    return this.driverService.remove(id);
  }

  @Query(() => [ServiceDriverEntity], { name: 'driversByLanguage' })
  @UseGuards(JwtAuthGuard)
  findByLanguage(
    @Args('speaksEnglish', { type: () => Boolean, nullable: true })
    speaksEnglish?: boolean,
    @Args('speaksVietnamese', { type: () => Boolean, nullable: true })
    speaksVietnamese?: boolean,
  ): Promise<ServiceDriverEntity[]> {
    return this.driverService.findByLanguage(speaksEnglish, speaksVietnamese);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF')
  async addDriverToVehicle(
    @Args('driverId', { type: () => ID }) driverId: string,
    @Args('vehicleServiceDetailId', { type: () => ID })
    vehicleServiceDetailId: string,
  ): Promise<boolean> {
    await this.driverService.addDriverToVehicle(
      driverId,
      vehicleServiceDetailId,
    );
    return true;
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF')
  async removeDriverFromVehicle(
    @Args('driverId', { type: () => ID }) driverId: string,
    @Args('vehicleServiceDetailId', { type: () => ID })
    vehicleServiceDetailId: string,
  ): Promise<boolean> {
    await this.driverService.removeDriverFromVehicle(
      driverId,
      vehicleServiceDetailId,
    );
    return true;
  }
}
