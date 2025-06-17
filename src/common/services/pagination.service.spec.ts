import { Test, TestingModule } from '@nestjs/testing';
import { PaginationService } from './pagination.service';

describe('PaginationService', () => {
  let service: PaginationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PaginationService],
    }).compile();

    service = module.get<PaginationService>(PaginationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createPaginationOptions', () => {
    it('should create default pagination options', () => {
      const result = service.createPaginationOptions();
      expect(result).toEqual({ page: 1, limit: 10 });
    });

    it('should create pagination options with custom values', () => {
      const result = service.createPaginationOptions(2, 20);
      expect(result).toEqual({ page: 2, limit: 20 });
    });

    it('should cap limit at 100', () => {
      const result = service.createPaginationOptions(1, 150);
      expect(result).toEqual({ page: 1, limit: 100 });
    });
  });

  describe('calculateSkip', () => {
    it('should calculate skip correctly', () => {
      const options = { page: 3, limit: 10 };
      const result = service.calculateSkip(options);
      expect(result).toBe(20);
    });

    it('should calculate skip for first page', () => {
      const options = { page: 1, limit: 10 };
      const result = service.calculateSkip(options);
      expect(result).toBe(0);
    });
  });

  describe('createPaginationResult', () => {
    it('should create pagination result correctly', () => {
      const data = [{ id: '1' }, { id: '2' }];
      const total = 25;
      const options = { page: 2, limit: 10 };

      const result = service.createPaginationResult(data, total, options);

      expect(result).toEqual({
        data,
        metadata: {
          total: 25,
          page: 2,
          limit: 10,
          totalPages: 3,
        },
      });
    });
  });

  describe('validatePaginationOptions', () => {
    it('should validate correct pagination options', () => {
      const result = service.validatePaginationOptions(2, 20);
      expect(result).toEqual({
        page: 2,
        limit: 20,
        errors: [],
      });
    });

    it('should return errors for invalid page', () => {
      const result = service.validatePaginationOptions(-1, 20);
      expect(result.errors).toContain('Page must be a positive integer');
      expect(result.page).toBe(1);
    });

    it('should return errors for invalid limit', () => {
      const result = service.validatePaginationOptions(1, 150);
      expect(result.errors).toContain(
        'Limit must be an integer between 1 and 100',
      );
      expect(result.limit).toBe(10);
    });
  });

  describe('parseDateRange', () => {
    it('should parse valid date range', () => {
      const result = service.parseDateRange('2023-01-01', '2023-12-31');
      expect(result.errors).toHaveLength(0);
      expect(result.gte).toEqual(new Date('2023-01-01'));
      expect(result.lte).toEqual(new Date('2023-12-31'));
    });

    it('should return errors for invalid dates', () => {
      const result = service.parseDateRange('invalid-date', '2023-12-31');
      expect(result.errors).toContain(
        'dateFrom must be a valid ISO date string',
      );
    });

    it('should return error when dateFrom is after dateTo', () => {
      const result = service.parseDateRange('2023-12-31', '2023-01-01');
      expect(result.errors).toContain('dateFrom must be before dateTo');
    });
  });
});
