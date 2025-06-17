import { SetMetadata } from '@nestjs/common';

export const RESOURCE_KEY = 'resource';

/**
 * Decorator to specify the resource being accessed
 * Used for resource-based access control
 */
export const Resource = (resource: string) =>
  SetMetadata(RESOURCE_KEY, resource);
