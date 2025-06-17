import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { LocationsService } from './locations.service';
import { LocationEntity, LocationType } from './entities/location.entity';
import { CreateLocationInput } from './dto/create-location.input';
import { UpdateLocationInput } from './dto/update-location.input';
import { LocationFilterDto } from './dto/location-filter.dto';
import { LocationPaginationResponse } from './entities/location-pagination-response.entity';
import { PaginationDto } from '../common/dto/pagination.dto';
import { GraphQLJwtAuthGuard } from '../auth/guards/graphql-jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ROLE_NAMES } from '../common/constants/roles';

@Resolver(() => LocationEntity)
export class LocationsResolver {
  constructor(private readonly locationsService: LocationsService) {}

  @Mutation(() => LocationEntity)
  @UseGuards(GraphQLJwtAuthGuard, RolesGuard)
  @Roles(ROLE_NAMES.ADMIN)
  async createLocation(
    @Args('input') createLocationInput: CreateLocationInput,
  ): Promise<LocationEntity> {
    return this.locationsService.create(createLocationInput);
  }

  @Query(() => LocationPaginationResponse)
  async locations(
    @Args('pagination') paginationDto: PaginationDto,
    @Args('filters', { nullable: true }) filters?: LocationFilterDto,
  ): Promise<LocationPaginationResponse> {
    const { data, total, page, limit } =
      await this.locationsService.findAllWithPagination(paginationDto, filters);

    return {
      data,
      metadata: { total, page, limit },
    };
  }

  @Query(() => LocationEntity, { nullable: true })
  async location(@Args('id') id: string): Promise<LocationEntity> {
    return this.locationsService.findOne(id);
  }

  @Mutation(() => LocationEntity)
  @UseGuards(GraphQLJwtAuthGuard, RolesGuard)
  @Roles(ROLE_NAMES.ADMIN)
  async updateLocation(
    @Args('id') id: string,
    @Args('input') updateLocationInput: UpdateLocationInput,
  ): Promise<LocationEntity> {
    return this.locationsService.update(id, updateLocationInput);
  }

  @Mutation(() => LocationEntity)
  @UseGuards(GraphQLJwtAuthGuard, RolesGuard)
  @Roles(ROLE_NAMES.ADMIN)
  async deleteLocation(@Args('id') id: string): Promise<LocationEntity> {
    return this.locationsService.remove(id);
  }

  @Query(() => [LocationEntity])
  async locationsByType(
    @Args('type', { type: () => LocationType }) type: LocationType,
  ): Promise<LocationEntity[]> {
    return this.locationsService.findByType(type);
  }

  @Query(() => [LocationEntity])
  async popularLocations(
    @Args('limit', { type: () => Number, nullable: true, defaultValue: 10 })
    limit?: number,
  ): Promise<LocationEntity[]> {
    return this.locationsService.findPopular(limit);
  }
}
