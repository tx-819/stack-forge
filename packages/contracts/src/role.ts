import type { BaseEntity, PaginationParams } from './response.js';

export interface Role extends BaseEntity {
  name: string;
  code: string;
  remark?: string | null;
  status: boolean;
}

export interface RoleListQuery extends PaginationParams {
  name?: string;
  code?: string;
}

export type CreateRoleRequest = Omit<Role, 'id' | 'createdAt' | 'updatedAt'>;

export type UpdateRoleRequest = Partial<CreateRoleRequest>;

export interface SetRolePermissionsRequest {
  permissionIds: number[];
}
