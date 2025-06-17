import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from './prisma.service';

export enum DatabaseType {
  SUPABASE = 'supabase',
}

export interface DatabaseHealth {
  database: DatabaseType;
  isHealthy: boolean;
  responseTime?: number;
  error?: string;
}

@Injectable()
export class DatabaseManager {
  constructor(
    @Inject(forwardRef(() => PrismaService))
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Get the database service for all operations
   */
  getDatabase() {
    return this.prisma;
  }

  /**
   * Get Supabase database
   */
  getSupabaseDb() {
    return this.prisma;
  }

  /**
   * Health check for the database
   */
  async healthCheck(): Promise<DatabaseHealth[]> {
    const results: DatabaseHealth[] = [];

    // Check Supabase
    try {
      const startTime = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      const responseTime = Date.now() - startTime;

      results.push({
        database: DatabaseType.SUPABASE,
        isHealthy: true,
        responseTime,
      });
    } catch (error) {
      results.push({
        database: DatabaseType.SUPABASE,
        isHealthy: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    return results;
  }

  /**
   * Execute transaction using Supabase database
   */
  async executeTransaction<T>(operation?: () => Promise<T>): Promise<T | null> {
    if (!operation) {
      return null;
    }

    try {
      return await operation();
    } catch (error) {
      console.error('Transaction failed:', error);
      throw error;
    }
  }
}
