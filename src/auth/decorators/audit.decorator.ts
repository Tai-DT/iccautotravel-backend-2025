import { SetMetadata } from '@nestjs/common';

export const AUDIT_ACTION_KEY = 'audit_action';

/**
 * Decorator to specify the action being performed for audit logging
 *
 * @param action - The action being performed (e.g., 'CREATE_SERVICE', 'VIEW_FINANCIAL_DATA', 'UPDATE_BOOKING')
 */
export const AuditAction = (action: string) =>
  SetMetadata(AUDIT_ACTION_KEY, action);
