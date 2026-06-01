import { get, post, put, del } from "../utils/request";

// 权限类型
export type PermissionType = "menu" | "action";

export interface MenuRecord extends Omit<Permission, "code"> {
  children?: MenuRecord[];
}

export interface ActionItem {
  name: string;
  code: string;
}

export interface AuthAction {
  pathname: string;
  actions: ActionItem[];
}

/**
 * 权限项接口（用于权限管理页面）
 */
export interface Permission {
  id: string;
  path: string;
  name: string;
  code?: string;
  permissionType: PermissionType;
  component?: string;
  parentId?: string | null;
  icon?: string;
  orderNo?: number;
  status?: boolean;
  remark?: string;
  children?: Permission[];
  key?: string; // 用于表格的 key
}

/**
 * 获取权限列表
 * @returns 权限列表
 */
export const getPermissionTreeApi = async (): Promise<Permission[]> => {
  return get<Permission[]>("/permission/tree");
};

/**
 * 创建权限
 * @param params 权限参数
 * @returns 创建的权限数据
 */
export const createPermissionApi = async (params: Partial<Permission>) => {
  return post("/permission", params);
};

/**
 * 更新权限
 * @param id 权限 ID
 * @param params 权限参数
 * @returns 更新的权限数据
 */
export const updatePermissionApi = async (
  id: string,
  params: Partial<Permission>,
) => {
  return put(`/permission/${id}`, params);
};

/**
 * 删除权限
 * @param id 权限 ID
 * @returns 删除结果
 */
export const deletePermissionApi = async (id: string) => {
  return del(`/permission/${id}`);
};
