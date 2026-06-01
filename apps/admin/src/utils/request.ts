/**
 * 统一的API请求封装（axios 双 token + HttpOnly RefreshToken 版）
 */

import axios from "axios";
import type {
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
  AxiosError,
} from "axios";

import { clearAuth, getAccessToken, setAccessToken } from "@/store/userStore";
import { message } from "antd";
import i18n from "./i18n";

// Base URL
// 生产 & 开发都默认走 `/api`，由各自的反向代理（nginx / vite dev server）转发到真正后端。
const BASE_URL = "/api";

/**
 * 通用响应格式
 */
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

/**
 * 请求配置扩展
 */
export interface RequestConfig extends AxiosRequestConfig {
  skipAuth?: boolean; // 是否跳过认证（用于登录等接口）
  _isRefresh?: boolean; // 标记是否为刷新 token 的请求
}

const client: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  // 关键点 1: 允许携带 Cookie
  // 这样浏览器才会自动把 HttpOnly 的 RefreshToken 发给后端，也能接收后端设置的新 Cookie
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

/* ==================== 双 token + 并发刷新逻辑 ==================== */

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const refreshAccessToken = async (): Promise<string> => {
  // 关键点 2: 不需要前端读取 RefreshToken
  // 浏览器会自动在请求头里带上 Cookie: refreshToken=xxx
  // 也不需要在 body 里传任何东西（除非后端有特殊要求）

  // 注意：这里不需要传 data，后端从 Cookie 读取
  const res = await axios.post<ApiResponse<{ accessToken: string }>>(
    `${BASE_URL}/auth/refreshToken`,
    {}, // 空对象，或者根据后端要求完全不传 body
    { withCredentials: true }, // 确保这次请求也带上凭证
  );

  const { data } = res.data;
  const newAccessToken = data.accessToken;

  // 关键点 3: 手动更新 Access Token（存到内存或 localStorage）
  setAccessToken(newAccessToken);

  // 关键点 4: 不需要更新 RefreshToken！
  // 后端会通过 Set-Cookie 响应头自动更新 HttpOnly 的 RefreshToken

  return newAccessToken;
};

/* ==================== 请求拦截器 ==================== */

client.interceptors.request.use(
  (config: InternalAxiosRequestConfig & { skipAuth?: boolean }) => {
    if (!config.skipAuth) {
      const token = getAccessToken();
      if (token) {
        // 只有 Access Token 需要手动塞到 Header 里
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

/* ==================== 响应拦截器 ==================== */

client.interceptors.response.use(
  (response) => response.data,
  async (error: AxiosError) => {
    const { config, response } = error;
    if (!config || !response) {
      return Promise.reject(error);
    }

    const requestConfig = config as InternalAxiosRequestConfig & RequestConfig;
    const isRefreshApi = requestConfig._isRefresh ?? false;
    const is401 = response.status === 401;

    // 非 401 或是刷新接口自身的 401，直接处理业务错误
    if (!is401 || isRefreshApi) {
      handleBusinessError(error);
      return Promise.reject(error);
    }

    if (is401) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (typeof token === "string") {
              requestConfig.headers.Authorization = `Bearer ${token}`;
            }
            return client.request(requestConfig);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      isRefreshing = true;

      try {
        const newAccessToken = await refreshAccessToken();
        processQueue(null, newAccessToken);

        requestConfig.headers.Authorization = `Bearer ${newAccessToken}`;
        return await client.request(requestConfig);
      } catch (refreshError) {
        // 刷新失败：清空本地 Access Token
        processQueue(refreshError as Error, null);
        clearAuth(); // 这里只会清掉内存/LocalStorage 里的 accessToken

        // HttpOnly 的 RefreshToken 我们无法在 JS 删除，
        // 通常由后端的 /logout 接口在服务端清除 Cookie。
        // 这里直接跳转登录页即可。
        if (!window.location.pathname.includes("/login")) {
          window.location.href = "/login";
        }
        message.error(i18n.t("error.loginExpired"));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

/* ==================== 业务错误处理 ==================== */

function handleBusinessError(error: AxiosError) {
  const { response, code } = error;
  const isNetworkError = code === "ECONNABORTED" || !response;

  if (isNetworkError) {
    message.error(i18n.t("error.networkError"));
    return;
  }

  if (!response) {
    return;
  }

  const { status, data } = response;
  const result: ApiResponse<unknown> = (data as ApiResponse<unknown>) || {};

  if (status === 401) {
    clearAuth();
    if (!window.location.pathname.includes("/login")) {
      window.location.href = "/login";
    }
    message.error(i18n.t("error.loginExpired"));
    throw new Error(i18n.t("error.unauthorized"));
  }

  if (status === 403) {
    message.error(result.message || i18n.t("error.forbidden"));
    throw new Error(result.message || i18n.t("error.forbiddenShort"));
  }

  message.error(result.message || i18n.t("error.requestFailed"));
  throw new Error(
    result.message || `${i18n.t("error.requestFailed")}: ${status}`,
  );
}

/* ==================== 封装方法 ==================== */

export const request = async <T>(
  url: string,
  config: RequestConfig = {},
): Promise<T> => {
  const { data } = await client(url, config);
  return data;
};

export const get = <T>(url: string, config?: RequestConfig): Promise<T> => {
  return request(url, { ...config, method: "GET" });
};

export const post = <T>(
  url: string,
  data?: unknown,
  config?: RequestConfig,
): Promise<T> => {
  return request(url, { ...config, method: "POST", data });
};

export const put = <T>(
  url: string,
  data?: unknown,
  config?: RequestConfig,
): Promise<T> => {
  return request(url, { ...config, method: "PUT", data });
};

export const del = <T>(url: string, config?: RequestConfig): Promise<T> => {
  return request(url, { ...config, method: "DELETE" });
};
