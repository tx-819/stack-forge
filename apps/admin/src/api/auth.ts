/**
 * 认证相关API
 */

import { post, get } from "../utils/request";
import type {
  AuthAction,
  LoginRequest,
  LoginResponse,
  MenuRecord,
  RegisterRequest,
  RegisterResponse,
  User,
} from "@stack-forge/contracts";

export type UserInfo = User;

/**
 * 登录请求参数
 */
export type LoginParams = LoginRequest;

/**
 * 登录响应数据（对应后端 AuthResponseDto）
 */
export type { LoginResponse };

/**
 * 用户登录
 * @param params 登录参数
 * @returns 登录响应数据
 */
export const login = async (params: LoginParams): Promise<LoginResponse> => {
  return post<LoginResponse>("/auth/login", params, {
    skipAuth: true, // 登录接口不需要认证
  });
};

/**
 * 注册请求参数
 */
export type RegisterParams = RegisterRequest;

/**
 * 注册响应数据（后端 register 直接返回 UserDto）
 */
export type { RegisterResponse };

/**
 * 用户注册
 * @param params 注册参数
 * @returns 注册响应数据
 */
export const register = async (
  params: RegisterParams,
): Promise<RegisterResponse> => {
  return post<RegisterResponse>("/auth/register", params, {
    skipAuth: true, // 注册接口不需要认证
  });
};

/**
 * 获取当前登录用户信息（需携带 token，用于刷新页面时同步用户信息）
 * @returns 用户信息
 */
export const getCurrentUser = async (): Promise<UserInfo> => {
  return get<UserInfo>("/auth/me");
};

/**
 * 获取当前用户有权限的菜单列表
 * @returns 用户菜单列表（树形结构）
 */
export const getUserMenus = async (): Promise<MenuRecord[]> => {
  return get<MenuRecord[]>("/auth/menus");
};

/**
 * 获取当前用户有权限的操作列表
 * @returns 用户操作权限列表
 */
export const getAuthActions = async (): Promise<AuthAction[]> => {
  return get<AuthAction[]>("/auth/actions");
};

/* ==================== 邮箱一键登录 ==================== */

/**
 * 发送一键登录链接到邮箱
 *
 * 后端流程：发送的邮件链接直接指向后端 `GET /auth/magic-login?token=...`，
 * 校验通过后由后端重定向到前端 `/login-success?accessToken=...`，
 * 因此前端无需再调用「校验链接」接口。
 *
 * @param email 用户邮箱
 */
export const sendLoginLink = async (email: string): Promise<void> => {
  return post<void>("/auth/sendLoginEmail", { email }, { skipAuth: true });
};
