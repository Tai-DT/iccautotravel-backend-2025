// src/auth/guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { RoleName } from '../../common/constants/roles';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Get required roles from metadata
    const requiredRoles = this.reflector.getAllAndOverride<RoleName[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true; // No specific role required, allow access
    }

    // Get user from request, handling both HTTP and GraphQL contexts
    let user: any;
    if (context.getType() === 'http') {
      const request = context.switchToHttp().getRequest();
      user = request.user;
    } else {
      // GraphQL context
      const ctx = GqlExecutionContext.create(context);
      const request = ctx.getContext().req;
      user = request.user;
    }

    if (!user) {
      return false;
    }

    // Check if user role matches any of the required roles
    const userRoleName = user.roleName || user.role?.name || user.role;

    // Map database role names to code constants
    const roleMapping: Record<string, string> = {
      'Super Admin': 'SUPER_ADMIN',
      Admin: 'ADMIN',
      Staff: 'STAFF',
      Driver: 'DRIVER',
      'Vehicle Ticket Manager': 'VEHICLE_TICKET_MANAGER',
      Customer: 'CUSTOMER',
    };

    const normalizedUserRole =
      roleMapping[userRoleName] || userRoleName?.toUpperCase() || userRoleName;

    console.log(
      'RolesGuard - User role:',
      userRoleName,
      '→ Normalized:',
      normalizedUserRole,
      'Required roles:',
      requiredRoles,
    );

    return requiredRoles.includes(normalizedUserRole as RoleName);
  }
}
