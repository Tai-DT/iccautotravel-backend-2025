import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);
  constructor(private prisma: PrismaService) {}

  async log(
    userId: string | null,
    action: string,
    details: Record<string, any>,
  ) {
    try {
      // Log to console instead of database since AuditLog table doesn't exist
      const logEntry = {
        id: uuidv4(),
        timestamp: new Date(),
        userId: userId || 'anonymous',
        action,
        details: JSON.stringify(details),
      };

      this.logger.log(
        `AUDIT: ${action} by ${userId || 'anonymous'} - ${JSON.stringify(details)}`,
      );

      // Uncomment this when AuditLog table exists in database
      /*
      await this.prisma.auditLog.create({
        data: {
          userId,
          action,
          details,
        },
      });
      */
    } catch (error) {
      this.logger.error(`Failed to write audit log: ${action}`, error);
    }
  }
}
