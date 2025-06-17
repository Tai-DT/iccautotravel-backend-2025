import { SetMetadata } from '@nestjs/common';
import { Permission } from '../../common/constants/permissions';

export const ENHANCED_PERMISSIONS_KEY = 'enhanced_permissions';
export const PERMISSION_LOGIC_KEY = 'permission_logic';

export interface PermissionConfig {
  permissions: Permission[];
  logic: 'AND' | 'OR'; // AND = user must have ALL permissions, OR = user needs ANY permission
  context?: string; // Additional context for permission checking
}

/**
 * Enhanced permissions decorator with support for AND/OR logic
 *
 * @param permissions - Array of required permissions
 * @param logic - 'AND' (default) requires all permissions, 'OR' requires any permission
 * @param context - Optional context for additional permission logic
 */
export const RequirePermissions = (
  permissions: Permission[],
  logic: 'AND' | 'OR' = 'AND',
  context?: string,
) => {
  const config: PermissionConfig = { permissions, logic, context };
  return SetMetadata(ENHANCED_PERMISSIONS_KEY, config);
};

/**
 * Shorthand for OR logic permissions
 */
export const RequireAnyPermission = (...permissions: Permission[]) =>
  RequirePermissions(permissions, 'OR');

/**
 * Shorthand for AND logic permissions (default behavior)
 */
export const RequireAllPermissions = (...permissions: Permission[]) =>
  RequirePermissions(permissions, 'AND');
