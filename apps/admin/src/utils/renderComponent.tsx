import type { LazyExoticComponent, ComponentType } from "react";
import { lazy } from "react";

// 使用 import.meta.glob 自动扫描所有页面组件
// 这会自动创建一个映射表，键是文件路径，值是导入函数
const pageModules = import.meta.glob<{ default: ComponentType<unknown> }>(
  "../pages/**/index.tsx",
  { eager: false },
);

const layoutModules = import.meta.glob<{ default: ComponentType<unknown> }>(
  "../layouts/**/index.tsx",
  { eager: false },
);

// 将路径转换为 glob 匹配的格式
// /dashboard -> ../pages/dashboard/index.tsx
// /system/users -> ../pages/system/users/index.tsx
const getComponent = (path: string) => {
  const isAbsolutePath = path.startsWith("/");
  if (isAbsolutePath) {
    const pageKey = path.slice(1);
    const pagePath = `../pages/${pageKey}/index.tsx`;
    return pageModules[pagePath];
  }
  const layoutPath = `${path}/index.tsx`;
  return layoutModules[layoutPath];
};

/**
 * 渲染组件
 * @param path 组件路径
 * @returns 懒加载组件
 */
export default function renderComponent(
  path: string,
): LazyExoticComponent<ComponentType<unknown>> | null {
  const component = getComponent(path);

  if (!component) {
    if (import.meta.env.DEV) {
      const availablePaths = Object.keys(pageModules).map((path) =>
        path.replace("../pages/", "/").replace("/index.tsx", ""),
      );
      console.warn(
        `Component not found for path: ${path}.`,
        `Available paths: ${availablePaths.join(", ")}`,
      );
    }
    return null;
  }

  return lazy(component);
}
