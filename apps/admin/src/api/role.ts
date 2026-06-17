import { get, post, put, del } from "../utils/request";
import { toPaginationResult } from "@stack-forge/shared";
import type { Permission } from "./permission";
import type {
  CreateRoleRequest,
  PaginatedData,
  Role,
  RoleListQuery,
  SetRolePermissionsRequest,
  UpdateRoleRequest,
} from "@stack-forge/contracts";

export type { Role };

/**
 * 获取角色列表请求参数
 */
export type GetRolePageParams = RoleListQuery;

/**
 * 获取角色列表
 * @param params 查询参数
 * @returns 角色列表数据
 */
export const getRoleListApi = (params?: GetRolePageParams) => {
  return toPaginationResult<Role>(
    get<PaginatedData<Role>>("/role/page", { params }),
  );
};

/**
 * 创建角色请求参数
 */
export type CreateRoleParams = CreateRoleRequest;

/**
 * 创建角色响应
 */
export const createRoleApi = (params: Partial<CreateRoleParams>) => {
  return post("/role", params);
};

/**
 * 更新角色请求参数
 */
export type UpdateRoleParams = UpdateRoleRequest;

/**
 * 更新角色
 * @param id 角色 ID
 * @param params 角色参数
 * @returns 更新的角色数据
 */
export const updateRoleApi = (id: number, params: Partial<UpdateRoleParams>) => {
  return put(`/role/${id}`, params);
};

/**
 * 删除角色
 * @param id 角色 ID
 * @returns 删除结果
 */
export const deleteRoleApi = (id: number) => {
  return del(`/role/${id}`);
};

/**
 * 查询角色权限
 * @param id 角色 ID
 * @returns 角色权限数据
 */
export const getRolePermissionsApi = (id: number) => {
  return get<Permission[]>(`/role/${id}/permissions`);
};

/**
 * 给角色添加权限请求参数
 */
export type UpdateRolePermissionsParams = SetRolePermissionsRequest;

/**
 * 给角色添加权限
 * @param id 角色 ID
 * @param params 权限参数
 * @returns 更新后的角色数据
 */
export const updateRolePermissionsApi = (
  id: number,
  params: UpdateRolePermissionsParams,
) => {
  return put(`/role/${id}/permissions`, params);
};
