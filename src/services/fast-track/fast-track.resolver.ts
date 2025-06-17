import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { FastTrackService } from './fast-track.service';
import { ServiceEntity } from '../entities/service.entity';
import { CreateFastTrackServiceInput } from './dto/create-fast-track-service.input'; // Use specific DTO
import { UpdateFastTrackServiceInput } from './dto/update-fast-track-service.input';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';
import { ROLE_NAMES } from '../../common/constants/roles';

@Resolver(() => ServiceEntity) // Associate with the generic ServiceEntity for now
@UseGuards(JwtAuthGuard, RolesGuard) // Apply guards to all endpoints in this resolver
export class FastTrackResolver {
  constructor(private readonly fastTrackService: FastTrackService) {}

  @Mutation(() => ServiceEntity)
  @Roles(ROLE_NAMES.ADMIN, ROLE_NAMES.STAFF) // Only ADMIN and STAFF can create Fast Track services
  createFastTrackService(
    @Args('createFastTrackServiceInput')
    createFastTrackServiceInput: CreateFastTrackServiceInput,
    @CurrentUser() user: User,
  ) {
    return this.fastTrackService.create(createFastTrackServiceInput, user.id);
  }

  @Query(() => [ServiceEntity], { name: 'fastTracks' })
  findAllFastTracks() {
    return this.fastTrackService.findAll();
  }

  @Query(() => ServiceEntity, { name: 'fastTrack' })
  findOneFastTrack(@Args('id', { type: () => ID }) id: string) {
    return this.fastTrackService.findOne(id);
  }

  @Mutation(() => ServiceEntity)
  @Roles(ROLE_NAMES.ADMIN, ROLE_NAMES.STAFF) // Only ADMIN and STAFF can update Fast Track services
  updateFastTrackService(
    @Args('id', { type: () => ID }) id: string,
    @Args('updateFastTrackServiceInput')
    updateFastTrackServiceInput: UpdateFastTrackServiceInput,
    @CurrentUser() user: User,
  ) {
    return this.fastTrackService.update(
      id,
      updateFastTrackServiceInput,
      user.id,
    );
  }

  @Mutation(() => ServiceEntity)
  @Roles(ROLE_NAMES.ADMIN, ROLE_NAMES.STAFF) // Only ADMIN and STAFF can remove Fast Track services
  removeFastTrackService(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: User,
  ) {
    return this.fastTrackService.remove(id, user.id);
  }
}
