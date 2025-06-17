import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions) {
      return true; // No permissions required, access granted
    }

    const ctx = GqlExecutionContext.create(context);
    const { user } = ctx.getContext().req; // Assuming user is attached to req

    if (!user || !user.role || !user.role.permissions) {
      return false; // No user or no permissions defined for the user's role
    }

    const userPermissions = user.role.permissions.map((p: any) => p.name); // Extract permission names

    return requiredPermissions.every((perm) => userPermissions.includes(perm));
  }
}
