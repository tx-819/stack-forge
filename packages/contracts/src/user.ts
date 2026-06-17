import type { BaseEntity, PaginationParams } from './response.js';
import type { Role } from './role.js';

export interface User extends BaseEntity {
  username: string;
  email: string | null;
  nickname: string | null;
  avatar: string | null;
  phone?: string | null;
  openid?: string | null;
  unionid?: string | null;
  status: boolean;
  isSuper: boolean;
}

export interface UserWithRoles extends User {
  roles: Role[];
}

export interface UserListQuery extends PaginationParams {
  username?: string;
  nickname?: string;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password?: string;
  nickname?: string | null;
  avatar?: string | null;
  roleIds?: number[];
}

export interface UpdateUserRequest {
  nickname?: string | null;
  email?: string | null;
  avatar?: string | null;
  status?: boolean;
  roleIds?: number[];
}
