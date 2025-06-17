import { Injectable } from '@nestjs/common';
import {
  PaginationOptions,
  PaginationResult,
  PaginationMetadata,
  createPaginationMetadata,
  calculatePaginationOffset,
} from '../interfaces/pagination.interface';

@Injectable()
export class PaginationService {
  /**
   * Create standardized pagination options
   */
  createPaginationOptions(page?: number, limit?: number): PaginationOptions {
    return {
      page: page || 1,
      limit: Math.min(limit || 10, 100), // Cap at 100 items per page
    };
  }

  /**
   * Calculate skip value for Prisma
   */
  calculateSkip(options: PaginationOptions): number {
    return calculatePaginationOffset(options.page, options.limit);
  }

  /**
   * Create standardized pagination result
   */
  createPaginationResult<T>(
    data: T[],
    total: number,
    options: PaginationOptions,
  ): PaginationResult<T> {
    return {
      data,
      metadata: createPaginationMetadata(total, options.page, options.limit),
    };
  }

  /**
   * Validate pagination parameters
   */
  validatePaginationOptions(
    page?: number,
    limit?: number,
  ): {
    page: number;
    limit: number;
    errors: string[];
  } {
    const errors: string[] = [];
    let validPage = page || 1;
    let validLimit = limit || 10;

    if (page !== undefined && (page < 1 || !Number.isInteger(page))) {
      errors.push('Page must be a positive integer');
      validPage = 1;
    }

    if (
      limit !== undefined &&
      (limit < 1 || limit > 100 || !Number.isInteger(limit))
    ) {
      errors.push('Limit must be an integer between 1 and 100');
      validLimit = 10;
    }

    return {
      page: validPage,
      limit: validLimit,
      errors,
    };
  }

  /**
   * Parse date range for filtering
   */
  parseDateRange(
    dateFrom?: string,
    dateTo?: string,
  ): {
    gte?: Date;
    lte?: Date;
    errors: string[];
  } {
    const errors: string[] = [];
    let gte: Date | undefined;
    let lte: Date | undefined;

    if (dateFrom) {
      try {
        gte = new Date(dateFrom);
        if (isNaN(gte.getTime())) {
          errors.push('dateFrom must be a valid ISO date string');
          gte = undefined;
        }
      } catch {
        errors.push('dateFrom must be a valid ISO date string');
      }
    }

    if (dateTo) {
      try {
        lte = new Date(dateTo);
        if (isNaN(lte.getTime())) {
          errors.push('dateTo must be a valid ISO date string');
          lte = undefined;
        }
      } catch {
        errors.push('dateTo must be a valid ISO date string');
      }
    }

    if (gte && lte && gte > lte) {
      errors.push('dateFrom must be before dateTo');
    }

    return { gte, lte, errors };
  }
}
