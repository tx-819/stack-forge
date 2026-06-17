import {
  PERMISSION_TYPES,
  type PermissionType,
} from '@stack-forge/contracts';

export function isPermissionType(value: unknown): value is PermissionType {
  return typeof value === 'string' && PERMISSION_TYPES.includes(value as PermissionType);
}
