import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ServicesServiceStandardized } from './services-standardized.service';
import { StandardPaginationDto } from '../common/dto/standard-pagination.dto';
import { ServiceFilterDto } from './dto/service-filter.dto';

@ApiTags('services-v2')
@Controller('api/v2/services')
export class ServicesV2Controller {
  constructor(private readonly servicesService: ServicesServiceStandardized) {}

  @Get()
  @ApiOperation({
    summary: 'Get all services with standardized pagination',
    description:
      'Standardized endpoint with consistent pagination and filtering',
  })
  @ApiResponse({
    status: 200,
    description: 'Services retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { type: 'object' },
        },
        metadata: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            page: { type: 'number' },
            limit: { type: 'number' },
            totalPages: { type: 'number' },
          },
        },
      },
    },
  })
  async findAll(
    @Query() paginationDto: StandardPaginationDto,
    @Query() filterDto: ServiceFilterDto,
  ) {
    try {
      return await this.servicesService.findAllWithStandardPagination(
        paginationDto,
        filterDto,
      );
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }
}
