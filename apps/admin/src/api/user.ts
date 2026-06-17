import { get, post, put, del } from "../utils/request";
import { toPaginationResult } from "@stack-forge/shared";
import type {
  CreateUserRequest,
  PaginatedData,
  UpdateUserRequest,
  UserListQuery,
  UserWithRoles,
} from "@stack-forge/contracts";

export type User = UserWithRoles;

/**
 * 获取用户列表请求参数
 */
export type GetUserPageParams = UserListQuery;

/**
 * 获取用户列表
 * @param params 查询参数
 * @returns 用户列表数据
 */
export const getUserListApi = (params?: GetUserPageParams) => {
  return toPaginationResult<User>(
    get<PaginatedData<User>>("/user/page", { params }),
  );
};

/**
 * 创建用户请求参数
 */
export type CreateUserParams = CreateUserRequest & {
  status?: boolean;
  isSuper?: boolean;
};

/**
 * 创建用户
 * @param params 用户参数
 * @returns 创建的用户数据
 */
export const createUserApi = (params: Partial<CreateUserParams>) => {
  return post("/user", params);
};

/**
 * 更新用户请求参数
 */
export type UpdateUserParams = UpdateUserRequest & {
  username?: string;
  email?: string | null;
  isSuper?: boolean;
};

/**
 * 更新用户
 * @param id 用户 ID
 * @param params 用户参数
 * @returns 更新的用户数据
 */
export const updateUserApi = (id: number, params: Partial<UpdateUserParams>) => {
  return put(`/user/${id}`, params);
};

/**
 * 删除用户
 * @param id 用户 ID
 * @returns 删除结果
 */
export const deleteUserApi = (id: number) => {
  return del(`/user/${id}`);
};
