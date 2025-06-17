import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class EnhancedPermissionsGuard implements CanActivate {
  private readonly logger = new Logger(EnhancedPermissionsGuard.name);

  constructor(
    private reflector: Reflector,
    private prismaService: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      // Get required permissions
      const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
        PERMISSIONS_KEY,
        [context.getHandler(), context.getClass()],
      );

      if (!requiredPermissions || requiredPermissions.length === 0) {
        return true; // No permissions required
      }

      // Get user from request
      const request = context.switchToHttp().getRequest();
      const user = request.user;

      if (!user) {
        this.logger.warn('No user found in request');
        throw new UnauthorizedException('Authentication required');
      }

      // Get user permissions
      const userPermissions = await this.getUserPermissions(user.id);

      // Check if user has required permissions
      const hasPermissions = this.checkPermissions(
        userPermissions,
        requiredPermissions,
      );

      if (!hasPermissions) {
        this.logger.warn(
          `User ${user.id} lacks permissions: ${requiredPermissions.join(', ')}`,
        );
        throw new ForbiddenException('Insufficient permissions');
      }

      // Log successful access
      this.logger.debug(
        `Access granted to user ${user.id} for permissions: ${requiredPermissions.join(', ')}`,
      );

      return true;
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }

      this.logger.error('Permission check failed:', error);
      throw new ForbiddenException('Permission check failed');
    }
  }

  private async getUserPermissions(userId: string): Promise<string[]> {
    try {
      const user = await this.prismaService.user.findUnique({
        where: { id: userId },
        include: {
          Role: true,
        },
      });

      if (!user || !user.Role) {
        return [];
      }

      // Get permissions based on role
      return this.getPermissionsForRole(user.Role.name);
    } catch (error) {
      this.logger.error('Failed to get user permissions:', error);
      return [];
    }
  }

  private getPermissionsForRole(roleName: string): string[] {
    // Define role-based permissions
    const rolePermissions: Record<string, string[]> = {
      SUPER_ADMIN: [
        'dashboard:read:full',
        'dashboard:read:financial',
        'dashboard:read:analytics',
        'dashboard:read:performance',
        'services:read',
        'services:create',
        'services:update',
        'services:delete',
        'services:view:analytics',
        'bookings:read:all',
        'bookings:create',
        'bookings:update',
        'bookings:view:analytics',
        'users:read:all',
        'users:create',
        'users:update',
        'users:view:analytics',
        'financial:read:revenue',
        'financial:read:reports',
        'financial:view:analytics',
        'financial:export:data',
      ],
      ADMIN: [
        'dashboard:read:full',
        'dashboard:read:financial',
        'dashboard:read:analytics',
        'services:read',
        'services:create',
        'services:update',
        'services:view:analytics',
        'bookings:read:all',
        'bookings:create',
        'bookings:update',
        'bookings:view:analytics',
        'users:read:all',
        'users:create',
        'users:update',
        'users:view:analytics',
        'financial:read:revenue',
        'financial:read:reports',
        'financial:view:analytics',
      ],
      STAFF: [
        'dashboard:read:basic',
        'services:read',
        'services:update',
        'bookings:read:all',
        'bookings:create',
        'bookings:update',
        'users:read:profile',
      ],
      DRIVER: [
        'dashboard:read:basic',
        'services:read',
        'bookings:read:assigned',
        'bookings:update',
        'users:read:profile',
      ],
      CUSTOMER: [
        'services:read',
        'bookings:read:own',
        'bookings:create',
        'users:read:profile',
      ],
    };

    return rolePermissions[roleName] || [];
  }

  private checkPermissions(
    userPermissions: string[],
    requiredPermissions: string[],
  ): boolean {
    return requiredPermissions.every((permission) =>
      userPermissions.includes(permission),
    );
  }
}
