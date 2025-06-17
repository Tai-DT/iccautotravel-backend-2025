import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationService } from './pagination.service';
import {
  PaginationResult,
  PaginationOptions,
} from '../interfaces/pagination.interface';
import { StandardPaginationDto } from '../dto/standard-pagination.dto';
import { BaseFilterDto } from '../dto/base-filter.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export abstract class BaseService<
  TEntity,
  TCreateDto,
  TUpdateDto,
  TFilterDto extends BaseFilterDto,
> {
  protected readonly logger: Logger;

  constructor(
    protected readonly prisma: PrismaService,
    protected readonly paginationService: PaginationService,
    serviceName: string,
  ) {
    this.logger = new Logger(serviceName);
  }

  /**
   * Abstract methods that must be implemented by child classes
   */
  protected abstract getModelDelegate(): any;
  protected abstract mapToEntity(data: any): TEntity;
  protected abstract buildWhereClause(filter: TFilterDto): any;

  /**
   * Standardized find all with pagination
   */
  async findAllWithPagination(
    paginationDto: StandardPaginationDto,
    filterDto: TFilterDto,
    orderBy?: any,
  ): Promise<PaginationResult<TEntity>> {
    try {
      const paginationOptions = this.paginationService.createPaginationOptions(
        paginationDto.page,
        paginationDto.limit,
      );

      const skip = this.paginationService.calculateSkip(paginationOptions);
      const where = this.buildWhereClause(filterDto);
      const defaultOrderBy = { createdAt: 'desc' as const };

      const [data, total] = await Promise.all([
        this.getModelDelegate().findMany({
          where,
          skip,
          take: paginationOptions.limit,
          orderBy: orderBy || defaultOrderBy,
        }),
        this.getModelDelegate().count({ where }),
      ]);

      const entities = data.map((item: any) => this.mapToEntity(item));

      return this.paginationService.createPaginationResult(
        entities,
        total,
        paginationOptions,
      );
    } catch (error) {
      this.logger.error('Error in findAllWithPagination', error);
      throw error;
    }
  }

  /**
   * Standardized find by ID
   */
  async findById(id: string, include?: any): Promise<TEntity | null> {
    try {
      const data = await this.getModelDelegate().findUnique({
        where: { id },
        ...(include && { include }),
      });

      return data ? this.mapToEntity(data) : null;
    } catch (error) {
      this.logger.error(`Error finding entity by ID: ${id}`, error);
      throw error;
    }
  }

  /**
   * Helper method to build date range filter
   */
  protected buildDateRangeFilter(dateFrom?: string, dateTo?: string): any {
    if (!dateFrom && !dateTo) return undefined;

    const dateRange = this.paginationService.parseDateRange(dateFrom, dateTo);

    if (dateRange.errors.length > 0) {
      throw new Error(`Date validation errors: ${dateRange.errors.join(', ')}`);
    }

    return {
      ...(dateRange.gte && { gte: dateRange.gte }),
      ...(dateRange.lte && { lte: dateRange.lte }),
    };
  }

  /**
   * Helper method to build search filter for multiple fields
   */
  protected buildSearchFilter(
    search: string,
    fields: string[],
  ): Prisma.StringFilter[] {
    return fields.map((field) => ({
      [field]: { contains: search, mode: 'insensitive' as const },
    }));
  }

  /**
   * Helper method to validate required fields
   */
  protected validateRequired(data: any, requiredFields: string[]): void {
    const missingFields = requiredFields.filter((field) => !data[field]);
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
  }

  /**
   * Helper method to clean undefined values from objects
   */
  protected cleanUndefined<T extends Record<string, any>>(obj: T): Partial<T> {
    const cleaned: Partial<T> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key as keyof T] = value;
      }
    }
    return cleaned;
  }
}
