import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { VEHICLE_TICKET_PERMISSIONS } from '../../common/constants/permissions';

@Injectable()
export class VehicleTicketGuard implements CanActivate {
  private readonly logger = new Logger(VehicleTicketGuard.name);

  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Allow ADMIN and SUPER_ADMIN full access
    if (['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return true;
    }

    // For VEHICLE_TICKET_MANAGER, check specific permissions and restrictions
    if (user.role === 'VEHICLE_TICKET_MANAGER') {
      return this.checkVehicleTicketManagerAccess(request, user);
    }

    // For other roles, deny access
    throw new ForbiddenException(
      'Insufficient permissions for vehicle ticket management',
    );
  }

  private async checkVehicleTicketManagerAccess(
    request: any,
    user: any,
  ): Promise<boolean> {
    const method = request.method;
    const url = request.url;

    // Get user permissions from database
    const userPermissions = await this.getUserPermissions(user.id);

    // Check if accessing specific ticket
    const ticketId = this.extractTicketId(request);
    if (ticketId) {
      const hasAccess = await this.checkTicketAccess(
        ticketId,
        user,
        userPermissions,
      );
      if (!hasAccess) {
        throw new ForbiddenException('Access denied to this vehicle ticket');
      }
    }

    // Additional business logic restrictions
    await this.enforceBusinessRules(request, user, userPermissions);

    return true;
  }

  private async getUserPermissions(userId: string): Promise<string[]> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          Role: {
            include: {
              Permission: true,
            },
          },
        },
      });

      return user?.Role?.Permission?.map((p: any) => p.name) || [];
    } catch (error) {
      this.logger.error('Failed to get user permissions', error);
      return [];
    }
  }

  private extractTicketId(request: any): string | null {
    // Extract ticket ID from URL parameters
    const params = request.params;
    return params?.id || null;
  }

  private async checkTicketAccess(
    ticketId: string,
    user: any,
    permissions: string[],
  ): Promise<boolean> {
    try {
      // Check if the booking is actually a vehicle ticket
      const booking = await this.prisma.booking.findUnique({
        where: { id: ticketId },
        include: {
          BookingServices: {
            include: {
              Service: true,
            },
          },
        },
      });

      if (!booking) {
        return false;
      }

      // Verify this is a vehicle-related booking
      const isVehicleTicket = booking.BookingServices.some((bs: any) =>
        ['BUS', 'VEHICLE', 'TRANSFER'].includes(bs.service.type),
      );

      if (!isVehicleTicket) {
        this.logger.warn(
          `User ${user.id} attempted to access non-vehicle booking ${ticketId}`,
        );
        return false;
      }

      // Additional access checks based on business rules
      // For example, restrict access to tickets from certain time periods
      const now = new Date();
      const ticketAge = now.getTime() - booking.createdAt.getTime();
      const maxAccessAge = 365 * 24 * 60 * 60 * 1000; // 1 year in milliseconds

      if (ticketAge > maxAccessAge) {
        this.logger.warn(
          `User ${user.id} attempted to access old ticket ${ticketId}`,
        );
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error(`Error checking ticket access for ${ticketId}`, error);
      return false;
    }
  }

  private async enforceBusinessRules(
    request: any,
    user: any,
    permissions: string[],
  ): Promise<void> {
    const url = request.url;
    const method = request.method;

    // Restrict financial operations
    if (url.includes('/refund') || url.includes('/payment')) {
      if (!permissions.includes('vehicle_tickets:process:refunds')) {
        throw new ForbiddenException(
          'Insufficient permissions for financial operations',
        );
      }
    }

    // Restrict data export during business hours (example business rule)
    if (url.includes('/export')) {
      const now = new Date();
      const hour = now.getHours();

      // Allow export only outside business hours (6 PM to 8 AM)
      if (hour >= 8 && hour < 18) {
        throw new ForbiddenException(
          'Data export is only allowed outside business hours (6 PM - 8 AM)',
        );
      }
    }

    // Limit bulk operations
    if (method === 'POST' && request.body?.bulk === true) {
      throw new ForbiddenException(
        'Bulk operations are not allowed for vehicle ticket managers',
      );
    }

    // Rate limiting for sensitive operations
    if (url.includes('/cancel') || url.includes('/refund')) {
      await this.checkRateLimit(user.id, 'sensitive_operations');
    }
  }

  private async checkRateLimit(
    userId: string,
    operation: string,
  ): Promise<void> {
    // Simple rate limiting implementation
    // In production, you might want to use Redis for this
    const cacheKey = `rate_limit:${userId}:${operation}`;
    const now = new Date();
    const windowStart = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour window

    // This is a simplified example - you'd implement proper rate limiting
    // For now, we'll just log the attempt
    this.logger.log(
      `Rate limit check for user ${userId}, operation: ${operation}`,
    );
  }

  // Helper method to check if user has specific vehicle ticket permission
  static hasVehicleTicketPermission(
    userPermissions: string[],
    permission: string,
  ): boolean {
    return userPermissions.includes(permission);
  }

  // Helper method to check multiple permissions (AND logic)
  static hasAllVehicleTicketPermissions(
    userPermissions: string[],
    permissions: string[],
  ): boolean {
    return permissions.every((permission) =>
      userPermissions.includes(permission),
    );
  }

  // Helper method to check multiple permissions (OR logic)
  static hasAnyVehicleTicketPermissions(
    userPermissions: string[],
    permissions: string[],
  ): boolean {
    return permissions.some((permission) =>
      userPermissions.includes(permission),
    );
  }
}
