import type { BaseEntity } from './response.js';

export const PERMISSION_TYPE_MENU = 'menu';
export const PERMISSION_TYPE_ACTION = 'action';
export const PERMISSION_TYPES = [
  PERMISSION_TYPE_MENU,
  PERMISSION_TYPE_ACTION,
] as const;

export type PermissionType = (typeof PERMISSION_TYPES)[number];

export interface ActionItem {
  name: string;
  code: string;
}

export interface AuthAction {
  pathname: string;
  actions: ActionItem[];
}

export interface Permission extends BaseEntity {
  name: string;
  code?: string | null;
  remark?: string | null;
  status: boolean;
  permissionType: PermissionType;
  path?: string | null;
  icon?: string | null;
  component?: string | null;
  orderNo?: number;
  parentId?: number | null;
  key?: string;
}

export interface PermissionTree extends Permission {
  children?: PermissionTree[] | null;
}

export interface MenuRecord extends Omit<PermissionTree, 'code'> {}

export type CreatePermissionRequest = Omit<
  Permission,
  'id' | 'createdAt' | 'updatedAt' | 'key'
>;

export type UpdatePermissionRequest = Partial<CreatePermissionRequest>;
