// Base pagination interfaces for consistent API responses
export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginationMetadata {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginationResult<T> {
  data: T[];
  metadata: PaginationMetadata;
}

// Base filter interface
export interface BaseFilter {
  search?: string;
  isActive?: boolean;
  dateFrom?: string;
  dateTo?: string;
}

// Helper function to create pagination metadata
export function createPaginationMetadata(
  total: number,
  page: number,
  limit: number,
): PaginationMetadata {
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

// Helper function to calculate pagination offset
export function calculatePaginationOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}
