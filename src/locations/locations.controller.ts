import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { LocationsService } from './locations.service';
import { CreateLocationInput } from './dto/create-location.input';
import { UpdateLocationInput } from './dto/update-location.input';
import { LocationFilterDto } from './dto/location-filter.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ROLE_NAMES } from '../common/constants/roles';
import { LocationType } from './entities/location.entity';

@Controller('api/locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE_NAMES.ADMIN)
  async create(@Body() createLocationData: any) {
    // Validate and convert type to enum
    if (
      !createLocationData.type ||
      !Object.values(LocationType).includes(createLocationData.type)
    ) {
      throw new BadRequestException(
        `Invalid location type. Must be one of: ${Object.values(LocationType).join(', ')}`,
      );
    }

    const createLocationInput: CreateLocationInput = {
      ...createLocationData,
      type: createLocationData.type as LocationType,
    };

    return this.locationsService.create(createLocationInput);
  }

  @Get()
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('type') type?: string,
    @Query('country') country?: string,
    @Query('city') city?: string,
    @Query('isActive') isActive?: boolean,
    @Query('isPopular') isPopular?: boolean,
  ) {
    const paginationDto: PaginationDto = {
      page: page || 1,
      limit: limit || 10,
    };

    const filters: LocationFilterDto = {};
    if (search) filters.search = search;
    if (type && Object.values(LocationType).includes(type as LocationType)) {
      filters.type = type as LocationType;
    }
    if (country) filters.country = country;
    if (city) filters.city = city;
    if (isActive !== undefined) filters.isActive = isActive;
    if (isPopular !== undefined) filters.isPopular = isPopular;

    const result = await this.locationsService.findAllWithPagination(
      paginationDto,
      filters,
    );

    return {
      data: result.data,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
      },
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.locationsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE_NAMES.ADMIN)
  async update(@Param('id') id: string, @Body() updateLocationData: any) {
    // Validate and convert type to enum if provided
    if (
      updateLocationData.type &&
      !Object.values(LocationType).includes(updateLocationData.type)
    ) {
      throw new BadRequestException(
        `Invalid location type. Must be one of: ${Object.values(LocationType).join(', ')}`,
      );
    }

    const updateLocationInput: UpdateLocationInput = {
      ...updateLocationData,
      ...(updateLocationData.type && {
        type: updateLocationData.type as LocationType,
      }),
    };

    return this.locationsService.update(id, updateLocationInput);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE_NAMES.ADMIN)
  async remove(@Param('id') id: string) {
    return this.locationsService.remove(id);
  }

  @Get('by-type/:type')
  async findByType(@Param('type') type: string) {
    if (!Object.values(LocationType).includes(type as LocationType)) {
      throw new BadRequestException(
        `Invalid location type. Must be one of: ${Object.values(LocationType).join(', ')}`,
      );
    }
    return this.locationsService.findByType(type as LocationType);
  }

  @Get('popular/list')
  async findPopular(@Query('limit') limit?: number) {
    return this.locationsService.findPopular(limit || 10);
  }
}
