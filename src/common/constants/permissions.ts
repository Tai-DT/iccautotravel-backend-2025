// Enhanced permissions system for ICC Auto Travel
export const PERMISSIONS = {
  // Dashboard permissions
  DASHBOARD: {
    READ_BASIC: 'dashboard:read:basic',
    READ_FULL: 'dashboard:read:full',
    READ_FINANCIAL: 'dashboard:read:financial',
    READ_ANALYTICS: 'dashboard:read:analytics',
    READ_PERFORMANCE: 'dashboard:read:performance',
  },

  // Service permissions
  SERVICES: {
    READ: 'services:read',
    CREATE: 'services:create',
    UPDATE: 'services:update',
    DELETE: 'services:delete',
    MANAGE_PRICING: 'services:manage:pricing',
    MANAGE_AVAILABILITY: 'services:manage:availability',
    VIEW_ANALYTICS: 'services:view:analytics',
  },

  // Booking permissions
  BOOKINGS: {
    READ_ALL: 'bookings:read:all',
    READ_OWN: 'bookings:read:own',
    READ_ASSIGNED: 'bookings:read:assigned',
    CREATE: 'bookings:create',
    UPDATE: 'bookings:update',
    DELETE: 'bookings:delete',
    CANCEL: 'bookings:cancel',
    APPROVE: 'bookings:approve',
    VIEW_ANALYTICS: 'bookings:view:analytics',
  },

  // Vehicle Ticket Management - Restricted permissions for external staff
  VEHICLE_TICKETS: {
    // View permissions
    READ_ALL_TICKETS: 'vehicle_tickets:read:all',
    READ_ASSIGNED_TICKETS: 'vehicle_tickets:read:assigned',
    READ_TICKET_DETAILS: 'vehicle_tickets:read:details',

    // Management permissions
    CREATE_TICKET: 'vehicle_tickets:create',
    UPDATE_TICKET_STATUS: 'vehicle_tickets:update:status',
    CANCEL_TICKET: 'vehicle_tickets:cancel',
    CONFIRM_TICKET: 'vehicle_tickets:confirm',
    MANAGE_SEAT_ASSIGNMENT: 'vehicle_tickets:manage:seats',

    // Vehicle operations
    VIEW_VEHICLE_SCHEDULE: 'vehicle_tickets:view:schedule',
    UPDATE_VEHICLE_STATUS: 'vehicle_tickets:update:vehicle_status',
    VIEW_PASSENGER_LIST: 'vehicle_tickets:view:passenger_list',

    // Limited analytics - only for vehicle tickets
    VIEW_TICKET_ANALYTICS: 'vehicle_tickets:view:analytics',
    EXPORT_TICKET_DATA: 'vehicle_tickets:export:data',

    // Customer service
    HANDLE_CUSTOMER_REQUESTS: 'vehicle_tickets:handle:customer_requests',
    PROCESS_REFUNDS: 'vehicle_tickets:process:refunds',

    // Route and schedule management
    VIEW_ROUTES: 'vehicle_tickets:view:routes',
    MANAGE_DEPARTURE_TIMES: 'vehicle_tickets:manage:departure_times',
  },

  // User management permissions
  USERS: {
    READ_ALL: 'users:read:all',
    READ_PROFILE: 'users:read:profile',
    CREATE: 'users:create',
    UPDATE: 'users:update',
    DELETE: 'users:delete',
    MANAGE_ROLES: 'users:manage:roles',
    VIEW_ANALYTICS: 'users:view:analytics',
    RESET_PASSWORD: 'users:reset:password',
  },

  // Financial permissions
  FINANCIAL: {
    READ_REVENUE: 'financial:read:revenue',
    READ_EXPENSES: 'financial:read:expenses',
    READ_REPORTS: 'financial:read:reports',
    MANAGE_PRICING: 'financial:manage:pricing',
    VIEW_ANALYTICS: 'financial:view:analytics',
    EXPORT_DATA: 'financial:export:data',
  },

  // Driver permissions
  DRIVERS: {
    READ_ALL: 'drivers:read:all',
    READ_OWN: 'drivers:read:own',
    UPDATE_STATUS: 'drivers:update:status',
    MANAGE_ASSIGNMENTS: 'drivers:manage:assignments',
    VIEW_PERFORMANCE: 'drivers:view:performance',
  },

  // Vehicle permissions
  VEHICLES: {
    READ: 'vehicles:read',
    CREATE: 'vehicles:create',
    UPDATE: 'vehicles:update',
    DELETE: 'vehicles:delete',
    MANAGE_MAINTENANCE: 'vehicles:manage:maintenance',
    VIEW_ANALYTICS: 'vehicles:view:analytics',
  },

  // Content management permissions
  CONTENT: {
    READ: 'content:read',
    CREATE: 'content:create',
    UPDATE: 'content:update',
    DELETE: 'content:delete',
    MANAGE_TRANSLATIONS: 'content:manage:translations',
    PUBLISH: 'content:publish',
  },

  // System permissions
  SYSTEM: {
    ADMIN_PANEL: 'system:admin:panel',
    VIEW_LOGS: 'system:view:logs',
    MANAGE_SETTINGS: 'system:manage:settings',
    BACKUP_DATA: 'system:backup:data',
    MONITOR_PERFORMANCE: 'system:monitor:performance',
  },
} as const;

// Permission groups for roles
export const PERMISSION_GROUPS = {
  SUPER_ADMIN: [
    ...Object.values(PERMISSIONS.DASHBOARD),
    ...Object.values(PERMISSIONS.SERVICES),
    ...Object.values(PERMISSIONS.BOOKINGS),
    ...Object.values(PERMISSIONS.VEHICLE_TICKETS),
    ...Object.values(PERMISSIONS.USERS),
    ...Object.values(PERMISSIONS.FINANCIAL),
    ...Object.values(PERMISSIONS.DRIVERS),
    ...Object.values(PERMISSIONS.VEHICLES),
    ...Object.values(PERMISSIONS.CONTENT),
    ...Object.values(PERMISSIONS.SYSTEM),
  ],

  ADMIN: [
    PERMISSIONS.DASHBOARD.READ_FULL,
    PERMISSIONS.DASHBOARD.READ_FINANCIAL,
    PERMISSIONS.DASHBOARD.READ_ANALYTICS,
    ...Object.values(PERMISSIONS.SERVICES),
    ...Object.values(PERMISSIONS.BOOKINGS),
    ...Object.values(PERMISSIONS.VEHICLE_TICKETS),
    PERMISSIONS.USERS.READ_ALL,
    PERMISSIONS.USERS.CREATE,
    PERMISSIONS.USERS.UPDATE,
    PERMISSIONS.USERS.MANAGE_ROLES,
    PERMISSIONS.USERS.VIEW_ANALYTICS,
    ...Object.values(PERMISSIONS.FINANCIAL),
    ...Object.values(PERMISSIONS.DRIVERS),
    ...Object.values(PERMISSIONS.VEHICLES),
    ...Object.values(PERMISSIONS.CONTENT),
    PERMISSIONS.SYSTEM.VIEW_LOGS,
    PERMISSIONS.SYSTEM.MANAGE_SETTINGS,
  ],

  FINANCE_MANAGER: [
    PERMISSIONS.DASHBOARD.READ_FINANCIAL,
    PERMISSIONS.DASHBOARD.READ_ANALYTICS,
    PERMISSIONS.SERVICES.READ,
    PERMISSIONS.SERVICES.MANAGE_PRICING,
    PERMISSIONS.BOOKINGS.READ_ALL,
    PERMISSIONS.BOOKINGS.VIEW_ANALYTICS,
    ...Object.values(PERMISSIONS.FINANCIAL),
    PERMISSIONS.USERS.READ_ALL,
  ],

  // Vehicle Ticket Manager - Restricted role for external staff
  VEHICLE_TICKET_MANAGER: [
    // Basic dashboard access
    PERMISSIONS.DASHBOARD.READ_BASIC,

    // Vehicle ticket specific permissions only
    ...Object.values(PERMISSIONS.VEHICLE_TICKETS),

    // Limited service access - only vehicle/bus related
    PERMISSIONS.SERVICES.READ,

    // Limited booking access - only vehicle bookings
    PERMISSIONS.BOOKINGS.READ_ALL,
    PERMISSIONS.BOOKINGS.CREATE,
    PERMISSIONS.BOOKINGS.UPDATE,
    PERMISSIONS.BOOKINGS.CANCEL,

    // Own profile only
    PERMISSIONS.USERS.READ_PROFILE,

    // Limited vehicle access
    PERMISSIONS.VEHICLES.READ,

    // Content read only
    PERMISSIONS.CONTENT.READ,
  ],

  STAFF: [
    PERMISSIONS.DASHBOARD.READ_BASIC,
    PERMISSIONS.SERVICES.READ,
    PERMISSIONS.SERVICES.UPDATE,
    PERMISSIONS.BOOKINGS.READ_ALL,
    PERMISSIONS.BOOKINGS.CREATE,
    PERMISSIONS.BOOKINGS.UPDATE,
    PERMISSIONS.USERS.READ_PROFILE,
    PERMISSIONS.DRIVERS.READ_ALL,
    PERMISSIONS.VEHICLES.READ,
    PERMISSIONS.CONTENT.READ,
    PERMISSIONS.CONTENT.UPDATE,
  ],

  DRIVER: [
    PERMISSIONS.DASHBOARD.READ_BASIC,
    PERMISSIONS.SERVICES.READ,
    PERMISSIONS.BOOKINGS.READ_ASSIGNED,
    PERMISSIONS.BOOKINGS.UPDATE,
    PERMISSIONS.USERS.READ_PROFILE,
    PERMISSIONS.DRIVERS.READ_OWN,
    PERMISSIONS.DRIVERS.UPDATE_STATUS,
    PERMISSIONS.VEHICLES.READ,
  ],

  CUSTOMER: [
    PERMISSIONS.SERVICES.READ,
    PERMISSIONS.BOOKINGS.READ_OWN,
    PERMISSIONS.BOOKINGS.CREATE,
    PERMISSIONS.BOOKINGS.CANCEL,
    PERMISSIONS.USERS.READ_PROFILE,
    PERMISSIONS.CONTENT.READ,
  ],
} as const;

// Helper functions
export type Permission = string;

export const getAllPermissions = (): Permission[] => {
  return Object.values(PERMISSIONS).flatMap((group) =>
    Object.values(group),
  ) as Permission[];
};

export const getPermissionsForRole = (
  role: keyof typeof PERMISSION_GROUPS,
): Permission[] => {
  return PERMISSION_GROUPS[role] as Permission[];
};

export const hasPermission = (
  userPermissions: string[],
  requiredPermission: Permission,
): boolean => {
  return userPermissions.includes(requiredPermission);
};

export const hasAnyPermission = (
  userPermissions: string[],
  requiredPermissions: Permission[],
): boolean => {
  return requiredPermissions.some((permission) =>
    userPermissions.includes(permission),
  );
};

export const hasAllPermissions = (
  userPermissions: string[],
  requiredPermissions: Permission[],
): boolean => {
  return requiredPermissions.every((permission) =>
    userPermissions.includes(permission),
  );
};

// Helper functions for vehicle ticket permissions
export const VEHICLE_TICKET_PERMISSIONS = {
  // Check if user can manage vehicle tickets
  canManageVehicleTickets: (userPermissions: string[]): boolean => {
    return userPermissions.includes(
      PERMISSIONS.VEHICLE_TICKETS.READ_ALL_TICKETS,
    );
  },

  // Check if user can handle customer requests
  canHandleCustomerRequests: (userPermissions: string[]): boolean => {
    return userPermissions.includes(
      PERMISSIONS.VEHICLE_TICKETS.HANDLE_CUSTOMER_REQUESTS,
    );
  },

  // Check if user can manage seat assignments
  canManageSeatAssignment: (userPermissions: string[]): boolean => {
    return userPermissions.includes(
      PERMISSIONS.VEHICLE_TICKETS.MANAGE_SEAT_ASSIGNMENT,
    );
  },

  // Check if user can view analytics (restricted)
  canViewTicketAnalytics: (userPermissions: string[]): boolean => {
    return userPermissions.includes(
      PERMISSIONS.VEHICLE_TICKETS.VIEW_TICKET_ANALYTICS,
    );
  },
} as const;
