import { get, post, put, del } from "../utils/request";
import type {
  AuthAction,
  CreatePermissionRequest,
  MenuRecord,
  Permission,
  PermissionTree,
  PermissionType,
  UpdatePermissionRequest,
} from "@stack-forge/contracts";

export type {
  AuthAction,
  MenuRecord,
  Permission,
  PermissionTree,
  PermissionType,
};

/**
 * 获取权限列表
 * @returns 权限列表
 */
export const getPermissionTreeApi = async (): Promise<PermissionTree[]> => {
  return get<PermissionTree[]>("/permission/tree");
};

/**
 * 创建权限
 * @param params 权限参数
 * @returns 创建的权限数据
 */
export const createPermissionApi = async (
  params: Partial<CreatePermissionRequest>,
) => {
  return post("/permission", params);
};

/**
 * 更新权限
 * @param id 权限 ID
 * @param params 权限参数
 * @returns 更新的权限数据
 */
export const updatePermissionApi = async (
  id: number,
  params: UpdatePermissionRequest,
) => {
  return put(`/permission/${id}`, params);
};

/**
 * 删除权限
 * @param id 权限 ID
 * @returns 删除结果
 */
export const deletePermissionApi = async (id: number) => {
  return del(`/permission/${id}`);
};
