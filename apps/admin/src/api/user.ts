import { get, post, put, del } from "../utils/request";
import type { Role } from "./role";
import { paginationResponse } from "../utils/tools";

/**
 * 角色项接口（用于用户角色）
 */
export interface User {
  id: string;
  username: string;
  email: string;
  nickname?: string;
  avatar?: string | null;
  status: number;
  isSuper: boolean;
  createdAt: string;
  updatedAt: string;
  roles: Role[];
}

/**
 * 获取用户列表请求参数
 */
export interface GetUserPageParams {
  page?: number;
  pageSize?: number;
  username?: string;
  nickname?: string;
}

/**
 * 获取用户列表
 * @param params 查询参数
 * @returns 用户列表数据
 */
export const getUserListApi = (params?: GetUserPageParams) => {
  return paginationResponse<User>(
    get<{ list: User[]; total: number }>("/user/page", { params }),
  );
};

/**
 * 创建用户请求参数
 */
export interface CreateUserParams extends Omit<
  User,
  "id" | "createdAt" | "updatedAt" | "roles"
> {
  roleIds?: string[];
}

/**
 * 创建用户
 * @param params 用户参数
 * @returns 创建的用户数据
 */
export const createUserApi = (params: CreateUserParams) => {
  return post("/user", params);
};

/**
 * 更新用户请求参数
 */
export interface UpdateUserParams extends Omit<
  User,
  "createdAt" | "updatedAt" | "roles"
> {
  roleIds?: string[];
}

/**
 * 更新用户
 * @param id 用户 ID
 * @param params 用户参数
 * @returns 更新的用户数据
 */
export const updateUserApi = (id: string, params: UpdateUserParams) => {
  return put(`/user/${id}`, params);
};

/**
 * 删除用户
 * @param id 用户 ID
 * @returns 删除结果
 */
export const deleteUserApi = (id: string) => {
  return del(`/user/${id}`);
};
