import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { FlightService } from './flight.service';
import { ServiceEntity } from '../entities/service.entity';
import { CreateFlightServiceInput } from './dto/create-flight-service.input'; // Use specific DTO
import { UpdateFlightServiceInput } from './dto/update-flight-service.input';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';
import { ROLE_NAMES } from '../../common/constants/roles';

@Resolver(() => ServiceEntity) // Associate with the generic ServiceEntity for now
@UseGuards(JwtAuthGuard, RolesGuard) // Apply guards to all endpoints in this resolver
export class FlightResolver {
  constructor(private readonly flightService: FlightService) {}

  @Mutation(() => ServiceEntity)
  @Roles(ROLE_NAMES.ADMIN, ROLE_NAMES.STAFF) // Only ADMIN and STAFF can create Flight services
  createFlightService(
    @Args('createFlightServiceInput')
    createFlightServiceInput: CreateFlightServiceInput,
    @CurrentUser() user: User,
  ) {
    return this.flightService.create(createFlightServiceInput, user.id);
  }

  @Query(() => [ServiceEntity], { name: 'flights' })
  findAllFlights() {
    return this.flightService.findAll();
  }

  @Query(() => ServiceEntity, { name: 'flight' })
  findOneFlight(@Args('id', { type: () => ID }) id: string) {
    return this.flightService.findOne(id);
  }

  @Mutation(() => ServiceEntity)
  @Roles(ROLE_NAMES.ADMIN, ROLE_NAMES.STAFF) // Only ADMIN and STAFF can update Flight services
  updateFlightService(
    @Args('id', { type: () => ID }) id: string,
    @Args('updateFlightServiceInput')
    updateFlightServiceInput: UpdateFlightServiceInput,
    @CurrentUser() user: User,
  ) {
    // No need to destructure, pass the input directly as FlightService now expects UpdateFlightServiceInput
    return this.flightService.update(id, updateFlightServiceInput, user.id);
  }

  @Mutation(() => ServiceEntity)
  @Roles(ROLE_NAMES.ADMIN, ROLE_NAMES.STAFF) // Only ADMIN and STAFF can remove Flight services
  removeFlightService(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: User,
  ) {
    return this.flightService.remove(id, user.id);
  }
}
