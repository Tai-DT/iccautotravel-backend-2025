import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { PrismaService } from '../../prisma/prisma.service';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { ENHANCED_PERMISSIONS_KEY } from '../decorators/enhanced-permissions.decorator';
import { Permission } from '../../common/constants/permissions';

interface SecurityContext {
  user: any;
  requestId: string;
  ip: string;
  userAgent: string;
  resource?: string;
  resourceId?: string;
  action?: string;
}

@Injectable()
export class EnhancedPermissionsGuard implements CanActivate {
  private readonly logger = new Logger(EnhancedPermissionsGuard.name);

  constructor(
    private reflector: Reflector,
    private prismaService: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const securityContext = this.buildSecurityContext(context);

    try {
      // Check if permissions are required for this endpoint
      const requiredPermissions = this.getRequiredPermissions(context);
      if (!requiredPermissions || requiredPermissions.length === 0) {
        await this.logAccess(
          securityContext,
          'ALLOWED',
          'No permissions required',
        );
        return true;
      }

      // Validate user exists and is active
      if (!securityContext.user) {
        await this.logAccess(securityContext, 'DENIED', 'No user found');
        throw new UnauthorizedException('Authentication required');
      }

      // Get user permissions from database
      const userPermissions = await this.getUserPermissions(
        securityContext.user.id,
      );

      // Check permissions
      const hasRequiredPermissions = this.checkPermissions(
        userPermissions,
        requiredPermissions,
      );

      if (!hasRequiredPermissions) {
        await this.logAccess(
          securityContext,
          'DENIED',
          `Missing permissions: ${requiredPermissions.join(', ')}`,
        );
        throw new ForbiddenException('Insufficient permissions');
      }

      // Resource-based access control
      const hasResourceAccess = await this.checkResourceAccess(
        securityContext,
        userPermissions,
      );

      if (!hasResourceAccess) {
        await this.logAccess(
          securityContext,
          'DENIED',
          'Resource access denied',
        );
        throw new ForbiddenException('Access to this resource is denied');
      }

      // Log successful access
      await this.logAccess(securityContext, 'ALLOWED', 'Access granted');

      return true;
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }

      this.logger.error('Permission check failed', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      await this.logAccess(securityContext, 'ERROR', errorMessage);
      throw new ForbiddenException('Permission check failed');
    }
  }

  private buildSecurityContext(context: ExecutionContext): SecurityContext {
    let request: any;

    if (context.getType() === 'http') {
      request = context.switchToHttp().getRequest();
    } else {
      const ctx = GqlExecutionContext.create(context);
      request = ctx.getContext().req;
    }

    return {
      user: request.user,
      requestId: request.headers['x-request-id'] || this.generateRequestId(),
      ip: request.ip || request.connection?.remoteAddress,
      userAgent: request.headers['user-agent'],
      resource: undefined, // Will be set when decorator is available
      resourceId: request.params?.id,
      action: undefined, // Will be set when decorator is available
    };
  }

  private getRequiredPermissions(context: ExecutionContext): Permission[] {
    // Check for enhanced permissions first
    const enhancedConfig = this.reflector.getAllAndOverride(
      ENHANCED_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (enhancedConfig) {
      return enhancedConfig.Permission || [];
    }

    // Fallback to basic permissions
    return (
      this.reflector.getAllAndOverride<Permission[]>(PERMISSIONS_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) || []
    );
  }

  private async getUserPermissions(userId: string): Promise<string[]> {
    try {
      const user = await this.prismaService.user.findUnique({
        where: { id: userId },
        include: {
          Role: {
            include: {
              Permission: true,
            },
          },
        },
      });

      if (!user || !user.Role) {
        return [];
      }

      // Extract permissions from role
      const rolePermissions =
        user.Role.Permission?.map((p: any) => p.name) || [];

      // Add role-based permissions from our constants
      const defaultRolePermissions = this.getDefaultPermissionsForRole(
        user.Role.name,
      );

      return [...new Set([...rolePermissions, ...defaultRolePermissions])];
    } catch (error) {
      this.logger.error('Failed to get user permissions', error);
      return [];
    }
  }

  private getDefaultPermissionsForRole(roleName: string): string[] {
    // Import dynamically to avoid circular dependencies
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const {
        getPermissionsForRole,
        PERMISSION_GROUPS,
      } = require('../../common/constants/permissions');

      if (roleName in PERMISSION_GROUPS) {
        return getPermissionsForRole(
          roleName as keyof typeof PERMISSION_GROUPS,
        );
      }
    } catch (error) {
      this.logger.warn('Failed to get default permissions for role', error);
    }

    return [];
  }

  private checkPermissions(
    userPermissions: string[],
    requiredPermissions: Permission[],
  ): boolean {
    // Check if user has ALL required permissions (AND logic)
    // For OR logic, use hasAnyPermission in the decorator
    return requiredPermissions.every((permission) =>
      userPermissions.includes(permission as string),
    );
  }

  private async checkResourceAccess(
    context: SecurityContext,
    userPermissions: string[],
  ): Promise<boolean> {
    // If no specific resource is defined, allow access
    if (!context.resource || !context.resourceId) {
      return true;
    }

    // Resource-specific access control logic
    switch (context.resource) {
      case 'booking':
        return this.checkBookingAccess(context, userPermissions);

      case 'user':
        return this.checkUserAccess(context, userPermissions);

      case 'service':
        return this.checkServiceAccess(context, userPermissions);

      case 'financial':
        return this.checkFinancialAccess(context, userPermissions);

      default:
        return true; // Unknown resources default to allowed
    }
  }

  private async checkBookingAccess(
    context: SecurityContext,
    userPermissions: string[],
  ): Promise<boolean> {
    try {
      // If user has admin permissions, allow all
      if (userPermissions.includes('bookings:read:all')) {
        return true;
      }

      // If user can only read own bookings, check ownership
      if (userPermissions.includes('bookings:read:own')) {
        const booking = await this.prismaService.booking.findUnique({
          where: { id: context.resourceId },
          select: { userId: true },
        });

        return booking?.userId === context.user.id;
      }

      // If user can read assigned bookings (for drivers)
      if (userPermissions.includes('bookings:read:assigned')) {
        const booking = await this.prismaService.booking.findUnique({
          where: { id: context.resourceId },
          select: {
            userId: true,
            // Add other fields as needed based on your schema
          },
        });

        // Simple check - can be extended based on your business logic
        return booking?.userId === context.user.id;
      }

      return false;
    } catch (error) {
      this.logger.error('Failed to check booking access', error);
      return false;
    }
  }

  private checkUserAccess(
    context: SecurityContext,
    userPermissions: string[],
  ): boolean {
    // Admin can access all users
    if (userPermissions.includes('users:read:all')) {
      return true;
    }

    // Users can only access their own profile
    if (userPermissions.includes('users:read:profile')) {
      return context.resourceId === context.user.id;
    }

    return false;
  }

  private checkServiceAccess(
    _context: SecurityContext,
    _userPermissions: string[],
  ): boolean {
    // Most service operations are role-based, not resource-based
    return true;
  }

  private checkFinancialAccess(
    _context: SecurityContext,
    userPermissions: string[],
  ): boolean {
    // Financial data requires specific permissions
    return userPermissions.some((p) =>
      [
        'financial:read:revenue',
        'financial:read:reports',
        'financial:view:analytics',
      ].includes(p),
    );
  }

  private logAccess(
    _context: SecurityContext,
    _result: 'ALLOWED' | 'DENIED' | 'ERROR',
    _reason: string,
  ): Promise<void> {
    // TODO: Audit log creation disabled due to schema mismatch
    // await this.prismaService.auditLog.create({ data: {...} });
    return Promise.resolve();
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
