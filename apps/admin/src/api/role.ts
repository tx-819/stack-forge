import { get, post, put, del } from "../utils/request";
import { paginationResponse } from "../utils/tools";
import type { Permission } from "./permission";

/**
 * 角色项接口
 */
export interface Role {
  id: string;
  name: string;
  code: string;
  remark?: string;
  status: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * 获取角色列表请求参数
 */
export interface GetRolePageParams {
  page?: number;
  pageSize?: number;
  name?: string;
  code?: string;
}

/**
 * 获取角色列表
 * @param params 查询参数
 * @returns 角色列表数据
 */
export const getRoleListApi = (params?: GetRolePageParams) => {
  return paginationResponse<Role>(
    get<{ list: Role[]; total: number }>("/role/page", { params }),
  );
};

/**
 * 创建角色请求参数
 */
export type CreateRoleParams = Omit<Role, "id" | "createdAt" | "updatedAt">;

/**
 * 创建角色响应
 */
export const createRoleApi = (params: CreateRoleParams) => {
  return post("/role", params);
};

/**
 * 更新角色请求参数
 */
export type UpdateRoleParams = Omit<Role, "createdAt" | "updatedAt">;

/**
 * 更新角色
 * @param id 角色 ID
 * @param params 角色参数
 * @returns 更新的角色数据
 */
export const updateRoleApi = (id: string, params: UpdateRoleParams) => {
  return put(`/role/${id}`, params);
};

/**
 * 删除角色
 * @param id 角色 ID
 * @returns 删除结果
 */
export const deleteRoleApi = (id: string) => {
  return del(`/role/${id}`);
};

/**
 * 查询角色权限
 * @param id 角色 ID
 * @returns 角色权限数据
 */
export const getRolePermissionsApi = (id: string) => {
  return get<Permission[]>(`/role/${id}/permissions`);
};

/**
 * 给角色添加权限请求参数
 */
export type UpdateRolePermissionsParams = {
  permissionIds: string[];
};

/**
 * 给角色添加权限
 * @param id 角色 ID
 * @param params 权限参数
 * @returns 更新后的角色数据
 */
export const updateRolePermissionsApi = (
  id: string,
  params: UpdateRolePermissionsParams,
) => {
  return put(`/role/${id}/permissions`, params);
};
