// Role name constants for consistency across the application
// Using uppercase format to match existing code usage
export const ROLE_NAMES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  STAFF: 'STAFF',
  DRIVER: 'DRIVER',
  VEHICLE_TICKET_MANAGER: 'VEHICLE_TICKET_MANAGER',
  CUSTOMER: 'CUSTOMER',
} as const;

export type RoleName =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'STAFF'
  | 'DRIVER'
  | 'VEHICLE_TICKET_MANAGER'
  | 'CUSTOMER';

// Role IDs for database operations (if needed)
export const ROLE_IDS = {
  SUPER_ADMIN: 'super-admin-role-id',
  ADMIN: 'admin-role-id',
  STAFF: 'staff-role-id',
  DRIVER: 'driver-role-id',
  VEHICLE_TICKET_MANAGER: 'vehicle-ticket-manager-role-id',
  CUSTOMER: 'customer-role-id',
} as const;

// Helper function to check if a user has a specific role
export const hasRole = (userRole: string, requiredRole: RoleName): boolean => {
  return userRole === requiredRole;
};

// Helper function to check if a user has any of the specified roles
export const hasAnyRole = (
  userRole: string,
  requiredRoles: RoleName[],
): boolean => {
  return requiredRoles.includes(userRole as RoleName);
};
