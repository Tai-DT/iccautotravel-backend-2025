import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { TourService } from './tour.service';
import { ServiceEntity } from '../entities/service.entity';
import { CreateTourServiceInput } from './dto/create-tour-service.input'; // Use specific DTO
import { UpdateTourServiceInput } from './dto/update-tour-service.input';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';
import { ROLE_NAMES } from '../../common/constants/roles';

@Resolver(() => ServiceEntity) // Associate with the generic ServiceEntity for now
@UseGuards(JwtAuthGuard, RolesGuard) // Apply guards to all endpoints in this resolver
export class TourResolver {
  constructor(private readonly tourService: TourService) {}

  @Mutation(() => ServiceEntity)
  @Roles(ROLE_NAMES.ADMIN, ROLE_NAMES.STAFF) // Only ADMIN and STAFF can create Tour services
  createTourService(
    @Args('createTourServiceInput')
    createTourServiceInput: CreateTourServiceInput,
    @CurrentUser() user: User,
  ) {
    return this.tourService.create(createTourServiceInput, user.id);
  }

  @Query(() => [ServiceEntity], { name: 'tours' })
  findAllTours() {
    return this.tourService.findAll();
  }

  @Query(() => ServiceEntity, { name: 'tour' })
  findOneTour(@Args('id', { type: () => ID }) id: string) {
    return this.tourService.findOne(id);
  }

  @Mutation(() => ServiceEntity)
  @Roles(ROLE_NAMES.ADMIN, ROLE_NAMES.STAFF) // Only ADMIN and STAFF can update Tour services
  updateTourService(
    @Args('id', { type: () => ID }) id: string,
    @Args('updateTourServiceInput')
    updateTourServiceInput: UpdateTourServiceInput,
    @CurrentUser() user: User,
  ) {
    return this.tourService.update(id, updateTourServiceInput, user.id);
  }

  @Mutation(() => ServiceEntity)
  @Roles(ROLE_NAMES.ADMIN, ROLE_NAMES.STAFF) // Only ADMIN and STAFF can remove Tour services
  removeTourService(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: User,
  ) {
    return this.tourService.remove(id, user.id);
  }
}
