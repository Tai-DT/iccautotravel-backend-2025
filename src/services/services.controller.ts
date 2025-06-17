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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiResponse,
} from '@nestjs/swagger';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServiceFilterDto } from './dto/service-filter.dto';
import { AdvancedServiceFilterDto } from './dto/advanced-service-filter.dto';
import { PaginationOptionsDto } from '../common/dto/pagination-options.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('services')
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new service' })
  @ApiResponse({ status: 201, description: 'Service created successfully' })
  async create(
    @Body() createServiceDto: CreateServiceDto,
    @CurrentUser() user: any,
  ) {
    return this.servicesService.create(createServiceDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all services with basic filtering' })
  @ApiResponse({ status: 200, description: 'Services retrieved successfully' })
  async findAll(@Query() options: PaginationOptionsDto & ServiceFilterDto) {
    // Convert string query parameters to numbers
    const processedOptions = {
      ...options,
      page: options.page ? parseInt(options.page.toString(), 10) : 1,
      limit: options.limit ? parseInt(options.limit.toString(), 10) : 10,
    };
    return this.servicesService.findAll(processedOptions);
  }

  @Get('search/advanced')
  @ApiOperation({ summary: 'Advanced search services by details' })
  @ApiResponse({ status: 200, description: 'Advanced search results' })
  async advancedSearch(@Query() filters: AdvancedServiceFilterDto) {
    return this.servicesService.advancedSearch(filters);
  }

  @Get('analytics/summary')
  @ApiOperation({ summary: 'Get services analytics summary' })
  @ApiResponse({ status: 200, description: 'Analytics summary retrieved' })
  async getAnalyticsSummary() {
    return this.servicesService.getServiceStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get service by ID' })
  @ApiResponse({ status: 200, description: 'Service found' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  async findOne(@Param('id') id: string) {
    return this.servicesService.findOne(id);
  }

  @Get(':id/details')
  @ApiOperation({ summary: 'Get service with details' })
  @ApiResponse({ status: 200, description: 'Service with details found' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  async findOneWithDetails(@Param('id') id: string) {
    return this.servicesService.findOneWithDetails(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update service' })
  @ApiResponse({ status: 200, description: 'Service updated successfully' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  async update(
    @Param('id') id: string,
    @Body() updateServiceDto: UpdateServiceDto,
    @CurrentUser() user: any,
  ) {
    return this.servicesService.update(id, updateServiceDto, user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete service' })
  @ApiResponse({ status: 200, description: 'Service deleted successfully' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.servicesService.remove(id, user.id);
  }

  @Patch(':id/toggle-active')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle service active status' })
  @ApiResponse({ status: 200, description: 'Service status toggled' })
  async toggleActive(@Param('id') id: string) {
    return this.servicesService.toggleActive(id);
  }

  // ================= DETAIL CREATION ENDPOINTS =================

  @Post('details/fast-track')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create FastTrack detail (and service if not provided)',
    description:
      'Creates a FastTrack service detail. If serviceId is not provided, a new service will be created automatically.',
  })
  @ApiResponse({
    status: 201,
    description: 'FastTrack detail created successfully',
  })
  async createFastTrackDetail(@Body() createDetailDto: any) {
    return this.servicesService.createFastTrackDetailWithService(
      createDetailDto,
    );
  }

  @Post('details/vehicle')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create Vehicle detail (and service if not provided)',
    description:
      'Creates a Vehicle service detail. If serviceId is not provided, a new service will be created automatically.',
  })
  @ApiResponse({
    status: 201,
    description: 'Vehicle detail created successfully',
  })
  async createVehicleDetail(@Body() createDetailDto: any) {
    return this.servicesService.createVehicleDetailWithService(createDetailDto);
  }

  @Post('details/tour')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create Tour detail (and service if not provided)',
    description:
      'Creates a Tour service detail. If serviceId is not provided, a new service will be created automatically.',
  })
  @ApiResponse({ status: 201, description: 'Tour detail created successfully' })
  async createTourDetail(@Body() createDetailDto: any) {
    return this.servicesService.createTourDetailWithService(createDetailDto);
  }
}
