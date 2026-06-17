import { create } from "zustand";
import type { MenuRecord } from "@/api/permission";
import type { ItemType } from "antd/es/menu/interface";
import { collectNormalizedMenuPaths, normalizeMenuPath } from "@/utils/menuPaths";
import { getIcon } from "@/utils/renderIcon";

// 菜单转换函数
const transformMenuItems = (routes: MenuRecord[]): ItemType[] => {
  return routes.map((r) => ({
    key: r.path ? normalizeMenuPath(r.path) : String(r.id),
    icon: r.icon ? getIcon(r.icon, { size: 16 }) : undefined,
    label: r.name,
    children: r.children ? transformMenuItems(r.children) : undefined,
  }));
};

interface MenuStore {
  menuList: ItemType[];
  allowedPathnames: string[];
  menuLoading: boolean;
  collapsed: boolean;
  openKeys: string[];
  selectedKey: string;
  setSelectedKey: (selectedKey: string) => void;
  setOpenKeys: (openKeys: string[]) => void;
  setCollapsed: (collapsed: boolean) => void;
  setMenuList: (menuList: MenuRecord[]) => void;
  setMenuLoading: (loading: boolean) => void;
  getMenuList: () => ItemType[];
}

export const useMenuStore = create<MenuStore>((set, get) => ({
  menuList: [],
  allowedPathnames: [],
  menuLoading: false,
  collapsed: false,
  openKeys: [],
  selectedKey: "",
  setSelectedKey: (selectedKey: string) => {
    set({ selectedKey });
  },
  setOpenKeys: (openKeys: string[]) => {
    set({ openKeys });
  },
  setCollapsed: (collapsed: boolean) => {
    set({ collapsed });
  },
  setMenuList: (menuList: MenuRecord[]) => {
    const menuItems = transformMenuItems(menuList);
    const allowedPathnames = collectNormalizedMenuPaths(menuList);
    set({ menuList: menuItems, allowedPathnames, menuLoading: false });
  },
  setMenuLoading: (loading: boolean) => {
    set({ menuLoading: loading });
  },
  getMenuList: () => get().menuList,
}));

// 为了保持 API 兼容性，导出这些函数
// 它们内部使用 Zustand store
export const setMenuList = (menuList: MenuRecord[]): void => {
  useMenuStore.getState().setMenuList(menuList);
};

export const getMenuList = (): ItemType[] => {
  return useMenuStore.getState().getMenuList();
};

export const setCollapsed = (collapsed: boolean): void => {
  useMenuStore.getState().setCollapsed(collapsed);
};

export const setMenuLoading = (loading: boolean): void => {
  useMenuStore.getState().setMenuLoading(loading);
};

export const setOpenKeys = (openKeys: string[]): void => {
  useMenuStore.getState().setOpenKeys(openKeys);
};
