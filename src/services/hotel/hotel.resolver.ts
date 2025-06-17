import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { HotelService } from './hotel.service';
import { ServiceEntity } from '../entities/service.entity';
import { CreateHotelServiceInput } from './dto/create-hotel-service.input'; // Use specific DTO
import { UpdateHotelServiceInput } from './dto/update-hotel-service.input';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Role, User } from '@prisma/client'; // Import Role and User from Prisma

@Resolver(() => ServiceEntity) // Associate with the generic ServiceEntity for now
@UseGuards(JwtAuthGuard, RolesGuard) // Apply guards to all endpoints in this resolver
export class HotelResolver {
  constructor(private readonly hotelService: HotelService) {}

  @Mutation(() => ServiceEntity)
  @Roles('ADMIN', 'STAFF') // Only ADMIN and STAFF can create Hotel services
  createHotelService(
    @Args('createHotelServiceInput')
    createHotelServiceInput: CreateHotelServiceInput,
    @CurrentUser() user: User,
  ) {
    return this.hotelService.create(createHotelServiceInput, user.id);
  }

  @Query(() => [ServiceEntity], { name: 'hotels' })
  findAllHotels() {
    return this.hotelService.findAll();
  }

  @Query(() => ServiceEntity, { name: 'hotel' })
  findOneHotel(@Args('id', { type: () => ID }) id: string) {
    return this.hotelService.findOne(id);
  }

  @Mutation(() => ServiceEntity)
  @Roles('ADMIN', 'STAFF') // Only ADMIN and STAFF can update Hotel services
  updateHotelService(
    @Args('id', { type: () => ID }) id: string,
    @Args('updateHotelServiceInput')
    updateHotelServiceInput: UpdateHotelServiceInput,
    @CurrentUser() user: User,
  ) {
    return this.hotelService.update(id, updateHotelServiceInput, user.id);
  }

  @Mutation(() => ServiceEntity)
  @Roles('ADMIN', 'STAFF') // Only ADMIN and STAFF can remove Hotel services
  removeHotelService(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: User,
  ) {
    return this.hotelService.remove(id, user.id);
  }
}
