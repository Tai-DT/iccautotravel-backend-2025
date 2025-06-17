// src/auth/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { ROLE_NAMES, RoleName } from '../../common/constants/roles';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: RoleName[]) => SetMetadata(ROLES_KEY, roles);
