import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { VehicleService } from './vehicle.service';
import { ServiceEntity } from '../entities/service.entity';
import { CreateVehicleServiceInput } from './dto/create-vehicle-service.input'; // Use specific DTO
import { UpdateVehicleServiceInput } from './dto/update-vehicle-service.input';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Role, User } from '@prisma/client'; // Import Role and User from Prisma
import { ServiceDriverEntity } from '../driver/entities/driver.entity';

@Resolver(() => ServiceEntity) // Associate with the generic ServiceEntity for now
@UseGuards(JwtAuthGuard, RolesGuard) // Apply guards to all endpoints in this resolver
export class VehicleResolver {
  constructor(private readonly vehicleService: VehicleService) {}

  @Mutation(() => ServiceEntity)
  @Roles('ADMIN', 'STAFF') // Only ADMIN and STAFF can create Vehicle services
  createVehicleService(
    @Args('createVehicleServiceInput')
    createVehicleServiceInput: CreateVehicleServiceInput,
    @CurrentUser() user: User,
  ) {
    return this.vehicleService.create(createVehicleServiceInput, user.id);
  }

  @Query(() => [ServiceEntity], { name: 'vehicles' })
  findAllVehicles() {
    return this.vehicleService.findAll();
  }

  @Query(() => ServiceEntity, { name: 'vehicle' })
  findOneVehicle(@Args('id', { type: () => ID }) id: string) {
    return this.vehicleService.findOne(id);
  }

  @Mutation(() => ServiceEntity)
  @Roles('ADMIN', 'STAFF') // Only ADMIN and STAFF can update Vehicle services
  updateVehicleService(
    @Args('id', { type: () => ID }) id: string,
    @Args('updateVehicleServiceInput')
    updateVehicleServiceInput: UpdateVehicleServiceInput,
    @CurrentUser() user: User,
  ) {
    return this.vehicleService.update(id, updateVehicleServiceInput, user.id);
  }

  @Mutation(() => ServiceEntity)
  @Roles('ADMIN', 'STAFF') // Only ADMIN and STAFF can remove Vehicle services
  removeVehicleService(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: User,
  ) {
    return this.vehicleService.remove(id, user.id);
  }

  @Query(() => [ServiceDriverEntity], { name: 'driversByLanguage' })
  findDriversByLanguage(
    @Args('speaksEnglish', { type: () => Boolean, nullable: true })
    speaksEnglish?: boolean,
    @Args('speaksVietnamese', { type: () => Boolean, nullable: true })
    speaksVietnamese?: boolean,
  ) {
    return this.vehicleService.findDriversByLanguage(
      speaksEnglish,
      speaksVietnamese,
    );
  }

  @Query(() => [ServiceDriverEntity], { name: 'vehicleDrivers' })
  getAvailableDriversForVehicle(
    @Args('vehicleId', { type: () => ID }) vehicleId: string,
  ) {
    return this.vehicleService.getAvailableDriversForVehicle(vehicleId);
  }

  @Mutation(() => ServiceEntity)
  @Roles('ADMIN', 'STAFF')
  assignDriverToVehicle(
    @Args('vehicleId', { type: () => ID }) vehicleId: string,
    @Args('driverId', { type: () => ID }) driverId: string,
  ) {
    return this.vehicleService.assignDriverToVehicle(vehicleId, driverId);
  }

  @Mutation(() => ServiceEntity)
  @Roles('ADMIN', 'STAFF')
  removeDriverFromVehicle(
    @Args('vehicleId', { type: () => ID }) vehicleId: string,
    @Args('driverId', { type: () => ID }) driverId: string,
  ) {
    return this.vehicleService.removeDriverFromVehicleService(
      vehicleId,
      driverId,
    );
  }
}
