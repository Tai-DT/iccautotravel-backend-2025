import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ServiceEntity } from './entities/service.entity';
import { ServiceFilterDto } from './dto/service-filter.dto';
import { PaginationService } from '../common/services/pagination.service';
import { StandardPaginationDto } from '../common/dto/standard-pagination.dto';
import { PaginationResult } from '../common/interfaces/pagination.interface';
import { Prisma } from '@prisma/client';

@Injectable()
export class ServicesServiceStandardized {
  private readonly logger = new Logger(ServicesServiceStandardized.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly paginationService: PaginationService,
  ) {}

  /**
   * Standardized method to find all services with pagination
   */
  async findAllWithStandardPagination(
    paginationDto: StandardPaginationDto,
    filterDto: ServiceFilterDto,
  ): Promise<PaginationResult<ServiceEntity>> {
    try {
      // Create pagination options
      const paginationOptions = this.paginationService.createPaginationOptions(
        paginationDto.page,
        paginationDto.limit,
      );

      // Calculate skip for Prisma
      const skip = this.paginationService.calculateSkip(paginationOptions);

      // Build where clause
      const where = this.buildWhereClause(filterDto);

      // Execute queries in parallel
      const [data, total] = await Promise.all([
        this.prisma.service.findMany({
          where,
          skip,
          take: paginationOptions.limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.service.count({ where }),
      ]);

      // Convert to entities
      const entities = data.map((service) => ServiceEntity.fromPrisma(service));

      // Return standardized result
      return this.paginationService.createPaginationResult(
        entities,
        total,
        paginationOptions,
      );
    } catch (error) {
      this.logger.error('Error in findAllWithStandardPagination', error);
      throw error;
    }
  }

  /**
   * Build where clause from filter DTO
   */
  private buildWhereClause(
    filterDto: ServiceFilterDto,
  ): Prisma.ServiceWhereInput {
    const where: Prisma.ServiceWhereInput = {};

    // Base filters from BaseFilterDto
    if (filterDto.search) {
      where.OR = [
        { name: { contains: filterDto.search, mode: 'insensitive' } },
        { description: { contains: filterDto.search, mode: 'insensitive' } },
      ];
    }

    if (filterDto.isActive !== undefined) {
      where.isActive = filterDto.isActive;
    }

    // Date range filter
    if (filterDto.dateFrom || filterDto.dateTo) {
      const dateRange = this.paginationService.parseDateRange(
        filterDto.dateFrom,
        filterDto.dateTo,
      );

      if (dateRange.gte || dateRange.lte) {
        where.createdAt = {
          ...(dateRange.gte && { gte: dateRange.gte }),
          ...(dateRange.lte && { lte: dateRange.lte }),
        };
      }
    }

    // Service-specific filters
    if (filterDto.type) {
      where.type = filterDto.type;
    }

    if (filterDto.name) {
      where.name = { contains: filterDto.name, mode: 'insensitive' };
    }

    if (filterDto.minPrice !== undefined || filterDto.maxPrice !== undefined) {
      where.metadata = {
        path: ['price'],
        ...(filterDto.minPrice !== undefined && { gte: filterDto.minPrice }),
        ...(filterDto.maxPrice !== undefined && { lte: filterDto.maxPrice }),
      };
    }

    if (filterDto.isDeleted !== undefined) {
      where.isDeleted = filterDto.isDeleted;
    }

    if (filterDto.tags && filterDto.tags.length > 0) {
      where.metadata = {
        path: ['tags'],
        array_contains: filterDto.tags,
      };
    }

    return where;
  }
}
