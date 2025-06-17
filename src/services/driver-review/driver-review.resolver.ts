import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { DriverReviewService } from './driver-review.service';
import {
  DriverReviewEntity,
  ReviewStatus,
} from './entities/driver-review.entity';
import { CreateDriverReviewInput } from './dto/create-driver-review.input';
import { UpdateDriverReviewInput } from './dto/update-driver-review.input';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { ROLE_NAMES } from '../../common/constants/roles';

@Resolver(() => DriverReviewEntity)
export class DriverReviewResolver {
  constructor(private readonly driverReviewService: DriverReviewService) {}

  @Mutation(() => DriverReviewEntity)
  @UseGuards(JwtAuthGuard)
  createDriverReview(
    @Args('input') createDriverReviewInput: CreateDriverReviewInput,
  ): Promise<DriverReviewEntity> {
    return this.driverReviewService.create(createDriverReviewInput);
  }

  @Query(() => [DriverReviewEntity], { name: 'driverReviews' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE_NAMES.ADMIN, ROLE_NAMES.STAFF)
  findAll(): Promise<DriverReviewEntity[]> {
    return this.driverReviewService.findAll();
  }

  @Query(() => [DriverReviewEntity], { name: 'driverReviewsByDriver' })
  @UseGuards(JwtAuthGuard)
  findByDriver(
    @Args('driverId', { type: () => ID }) driverId: string,
  ): Promise<DriverReviewEntity[]> {
    return this.driverReviewService.findByDriver(driverId);
  }

  @Query(() => DriverReviewEntity, { name: 'driverReview' })
  @UseGuards(JwtAuthGuard)
  findOne(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<DriverReviewEntity> {
    return this.driverReviewService.findOne(id);
  }

  @Mutation(() => DriverReviewEntity)
  @UseGuards(JwtAuthGuard)
  updateDriverReview(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') updateDriverReviewInput: UpdateDriverReviewInput,
  ): Promise<DriverReviewEntity> {
    return this.driverReviewService.update(id, updateDriverReviewInput);
  }

  @Mutation(() => DriverReviewEntity)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE_NAMES.ADMIN, ROLE_NAMES.STAFF)
  updateDriverReviewStatus(
    @Args('id', { type: () => ID }) id: string,
    @Args('status', { type: () => ReviewStatus }) status: ReviewStatus,
  ): Promise<DriverReviewEntity> {
    return this.driverReviewService.updateStatus(id, status);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE_NAMES.ADMIN, ROLE_NAMES.STAFF)
  removeDriverReview(@Args('id', { type: () => ID }) id: string): Promise<any> {
    return this.driverReviewService.remove(id);
  }
}
