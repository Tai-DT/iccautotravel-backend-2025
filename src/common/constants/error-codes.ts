export const ErrorCodes = {
  // User related errors
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  USER_ALREADY_EXISTS: 'USER_ALREADY_EXISTS',
  USER_DELETE_FAILED: 'USER_DELETE_FAILED',
  USER_UPDATE_FAILED: 'USER_UPDATE_FAILED',
  USER_CREATION_FAILED: 'USER_CREATION_FAILED',
  USER_NOT_ACTIVE: 'USER_NOT_ACTIVE',
  USER_INVALID_CREDENTIALS: 'USER_INVALID_CREDENTIALS',
  USER_EMAIL_NOT_VERIFIED: 'USER_EMAIL_NOT_VERIFIED',
  USER_PASSWORD_RESET_FAILED: 'USER_PASSWORD_RESET_FAILED',
  USER_PASSWORD_INVALID: 'USER_PASSWORD_INVALID',

  // Service errors
  SERVICE_NOT_FOUND: 'SERVICE_NOT_FOUND',
  SERVICE_ALREADY_EXISTS: 'SERVICE_ALREADY_EXISTS',
  SERVICE_DELETE_FAILED: 'SERVICE_DELETE_FAILED',
  SERVICE_UPDATE_FAILED: 'SERVICE_UPDATE_FAILED',
  SERVICE_CREATION_FAILED: 'SERVICE_CREATION_FAILED',

  // Booking related errors
  BOOKING_NOT_FOUND: 'BOOKING_NOT_FOUND',
  BOOKING_ALREADY_EXISTS: 'BOOKING_ALREADY_EXISTS',
  BOOKING_DELETE_FAILED: 'BOOKING_DELETE_FAILED',
  BOOKING_UPDATE_FAILED: 'BOOKING_UPDATE_FAILED',
  BOOKING_CREATION_FAILED: 'BOOKING_CREATION_FAILED',
  BOOKING_INVALID_STATUS: 'BOOKING_INVALID_STATUS',
  BOOKING_TIME_CONFLICT: 'BOOKING_TIME_CONFLICT',
  BOOKING_PAYMENT_REQUIRED: 'BOOKING_PAYMENT_REQUIRED',
  BOOKING_CANCEL_NOT_ALLOWED: 'BOOKING_CANCEL_NOT_ALLOWED',
  BOOKING_UPDATE_NOT_ALLOWED: 'BOOKING_UPDATE_NOT_ALLOWED',
  BOOKING_VERSION_CONFLICT: 'BOOKING_VERSION_CONFLICT',

  // Payment related errors
  PAYMENT_NOT_FOUND: 'PAYMENT_NOT_FOUND',
  PAYMENT_ALREADY_EXISTS: 'PAYMENT_ALREADY_EXISTS',
  PAYMENT_PROVIDER_NOT_SUPPORTED: 'PAYMENT_PROVIDER_NOT_SUPPORTED',
  PAYMENT_CREATION_FAILED: 'PAYMENT_CREATION_FAILED',
  PAYMENT_VERIFICATION_FAILED: 'PAYMENT_VERIFICATION_FAILED',
  PAYMENT_WEBHOOK_INVALID: 'PAYMENT_WEBHOOK_INVALID',

  // Authentication & Authorization errors
  AUTH_TOKEN_INVALID: 'AUTH_TOKEN_INVALID',
  AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  AUTH_UNAUTHORIZED: 'AUTH_UNAUTHORIZED',
  AUTH_FORBIDDEN: 'AUTH_FORBIDDEN',
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_INSUFFICIENT_PERMISSIONS: 'AUTH_INSUFFICIENT_PERMISSIONS',

  // Validation errors
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  VALIDATION_CONSTRAINT_ERROR: 'VALIDATION_CONSTRAINT_ERROR',

  // Integration errors
  INTEGRATION_WEBHOOK_INVALID: 'INTEGRATION_WEBHOOK_INVALID',
  INTEGRATION_HMAC_INVALID: 'INTEGRATION_HMAC_INVALID',
  INTEGRATION_REDIRECT_FAILED: 'INTEGRATION_REDIRECT_FAILED',
  INTEGRATION_CALLBACK_FAILED: 'INTEGRATION_CALLBACK_FAILED',

  // System errors
  SYSTEM_DATABASE_ERROR: 'SYSTEM_DATABASE_ERROR',
  SYSTEM_EXTERNAL_API_ERROR: 'SYSTEM_EXTERNAL_API_ERROR',
  SYSTEM_NETWORK_ERROR: 'SYSTEM_NETWORK_ERROR',
  SYSTEM_TIMEOUT: 'SYSTEM_TIMEOUT',
  SYSTEM_UNKNOWN_ERROR: 'SYSTEM_UNKNOWN_ERROR',
} as const;

export const ErrorMessages = {
  [ErrorCodes.USER_NOT_FOUND]: 'User not found',
  [ErrorCodes.USER_ALREADY_EXISTS]: 'User already exists',
  [ErrorCodes.USER_DELETE_FAILED]: 'Failed to delete user',
  [ErrorCodes.USER_UPDATE_FAILED]: 'Failed to update user',
  [ErrorCodes.USER_CREATION_FAILED]: 'Failed to create user',
  [ErrorCodes.USER_NOT_ACTIVE]: 'User is not active',
  [ErrorCodes.USER_INVALID_CREDENTIALS]: 'Invalid user credentials',
  [ErrorCodes.USER_EMAIL_NOT_VERIFIED]: 'User email is not verified',
  [ErrorCodes.USER_PASSWORD_RESET_FAILED]: 'Failed to reset user password',
  [ErrorCodes.USER_PASSWORD_INVALID]: 'Invalid user password',

  [ErrorCodes.SERVICE_NOT_FOUND]: 'Service not found',
  [ErrorCodes.SERVICE_ALREADY_EXISTS]: 'Service already exists',
  [ErrorCodes.SERVICE_DELETE_FAILED]: 'Failed to delete service',
  [ErrorCodes.SERVICE_UPDATE_FAILED]: 'Failed to update service',
  [ErrorCodes.SERVICE_CREATION_FAILED]: 'Failed to create service',

  [ErrorCodes.BOOKING_NOT_FOUND]: 'Booking not found',
  [ErrorCodes.BOOKING_ALREADY_EXISTS]: 'Booking already exists',
  [ErrorCodes.BOOKING_DELETE_FAILED]: 'Failed to delete booking',
  [ErrorCodes.BOOKING_UPDATE_FAILED]: 'Failed to update booking',
  [ErrorCodes.BOOKING_CREATION_FAILED]: 'Failed to create booking',
  [ErrorCodes.BOOKING_INVALID_STATUS]: 'Invalid booking status',
  [ErrorCodes.BOOKING_TIME_CONFLICT]:
    'Booking time conflicts with existing bookings',
  [ErrorCodes.BOOKING_PAYMENT_REQUIRED]: 'Payment is required for this booking',
  [ErrorCodes.BOOKING_CANCEL_NOT_ALLOWED]:
    'Booking cannot be cancelled within 24 hours',
  [ErrorCodes.BOOKING_UPDATE_NOT_ALLOWED]:
    'Booking cannot be updated in current status',
  [ErrorCodes.BOOKING_VERSION_CONFLICT]:
    'Booking has been modified by another user',

  [ErrorCodes.PAYMENT_NOT_FOUND]: 'Payment not found',
  [ErrorCodes.PAYMENT_ALREADY_EXISTS]:
    'Payment already exists for this booking',
  [ErrorCodes.PAYMENT_PROVIDER_NOT_SUPPORTED]:
    'Payment provider is not supported',
  [ErrorCodes.PAYMENT_CREATION_FAILED]: 'Failed to create payment',
  [ErrorCodes.PAYMENT_VERIFICATION_FAILED]: 'Payment verification failed',
  [ErrorCodes.PAYMENT_WEBHOOK_INVALID]: 'Invalid payment webhook',

  [ErrorCodes.AUTH_TOKEN_INVALID]: 'Invalid authentication token',
  [ErrorCodes.AUTH_TOKEN_EXPIRED]: 'Authentication token has expired',
  [ErrorCodes.AUTH_UNAUTHORIZED]: 'Unauthorized access',
  [ErrorCodes.AUTH_FORBIDDEN]: 'Forbidden access',
  [ErrorCodes.AUTH_INVALID_CREDENTIALS]: 'Invalid credentials',
  [ErrorCodes.AUTH_INSUFFICIENT_PERMISSIONS]: 'Insufficient permissions',

  [ErrorCodes.VALIDATION_FAILED]: 'Validation failed',
  [ErrorCodes.VALIDATION_CONSTRAINT_ERROR]: 'Validation constraint error',

  [ErrorCodes.INTEGRATION_WEBHOOK_INVALID]: 'Invalid webhook',
  [ErrorCodes.INTEGRATION_HMAC_INVALID]: 'Invalid HMAC signature',
  [ErrorCodes.INTEGRATION_REDIRECT_FAILED]: 'Failed to redirect',
  [ErrorCodes.INTEGRATION_CALLBACK_FAILED]: 'Failed to process callback',

  [ErrorCodes.SYSTEM_DATABASE_ERROR]: 'Database error occurred',
  [ErrorCodes.SYSTEM_EXTERNAL_API_ERROR]: 'External API error occurred',
  [ErrorCodes.SYSTEM_NETWORK_ERROR]: 'Network error occurred',
  [ErrorCodes.SYSTEM_TIMEOUT]: 'Request timeout',
  [ErrorCodes.SYSTEM_UNKNOWN_ERROR]: 'An unknown error occurred',
} as const;
