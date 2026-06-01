import type { UserInfo } from "@/api/auth";
import type { AuthAction } from "@/api/permission";
import { setMenuList } from "./menuStore";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface userStore extends UserInfo {
  token?: string;
  isLogin: boolean;
  setUser: (user: UserInfo | null) => void;
  authActions: AuthAction[];
  setAuthActions: (authActions: AuthAction[]) => void;
}

const initialState = {
  id: 0,
  username: "",
  nickname: "",
  avatar: "",
  isSuper: false,
  token: "",
  isLogin: false,
  authActions: [],
};

export const useUserStore = create<userStore>()(
  persist(
    (set) => ({
      ...initialState,
      setUser: (user: UserInfo | null) => {
        set({ ...user });
      },
      setAuthActions: (authActions: AuthAction[]) => {
        set({ authActions });
      },
    }),
    { name: "user-storage" },
  ),
);

// 为了保持 API 兼容性，导出这些函数
// 它们内部使用 Zustand store
export const setUser = (user: UserInfo | null): void => {
  useUserStore.getState().setUser(user);
};

export const getUser = (): userStore | null => {
  return useUserStore.getState();
};

export const getAccessToken = (): string | undefined => {
  return useUserStore.getState().token;
};

export const setAccessToken = (token: string): void => {
  useUserStore.setState({ token, isLogin: true });
};

export const removeAccessToken = (): void => {
  useUserStore.setState({ token: "", isLogin: false, authActions: [] });
};

export const getIsLogin = (): boolean => {
  return useUserStore.getState().isLogin;
};

/**
 * 清除所有认证信息
 */
export const clearAuth = (): void => {
  useUserStore.setState({ ...initialState });
  setMenuList([]);
};
