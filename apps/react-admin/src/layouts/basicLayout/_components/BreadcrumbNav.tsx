import { useLocation, useNavigate } from "react-router";
import { Breadcrumb } from "antd";
import { useMenuStore } from "@/store/menuStore";
import { useMemo } from "react";
import type { ItemType } from "antd/es/menu/interface";

// 类型守卫：检查菜单项是否有子项
const hasChildren = (
  item: ItemType
): item is ItemType & { children: ItemType[] } => {
  return (
    item !== null &&
    typeof item === "object" &&
    "children" in item &&
    Array.isArray(item.children) &&
    item.children.length > 0
  );
};

// 获取菜单项的标签
const getMenuItemLabel = (item: ItemType): string => {
  if (item === null || typeof item !== "object") return "";
  if ("label" in item) {
    const label = item.label;
    if (typeof label === "string") return label;
    if (typeof label === "object" && label !== null) {
      // 如果是 ReactNode，尝试获取文本内容
      return String(item.key || "");
    }
  }
  return String(item.key || "");
};

// 获取面包屑数据
const getBreadcrumbItems = (
  menuList: ItemType[],
  targetPath: string,
  parentPath = "",
  breadcrumbs: Array<{ title: string; path: string }> = []
): Array<{ title: string; path: string }> | null => {
  for (const item of menuList) {
    if (!item) continue;

    const itemKey = item.key?.toString() || "";
    const currentPath = parentPath
      ? `${parentPath}/${itemKey}`.replace(/\/+/g, "/")
      : `/${itemKey}`;

    const itemLabel = getMenuItemLabel(item);
    const path = hasChildren(item)
      ? `${currentPath}/${item.children[0]?.key}`
      : currentPath;
    const currentBreadcrumb = { title: itemLabel, path: path };

    // 规范化路径进行比较（统一格式：都以 / 开头，去掉尾随斜杠）
    const normalizePath = (path: string) => {
      const normalized = path.replace(/\/+$/, ""); // 去掉尾随斜杠
      return normalized.startsWith("/") ? normalized : `/${normalized}`;
    };

    const normalizedCurrent = normalizePath(currentPath);
    const normalizedTarget = normalizePath(targetPath);

    // 检查当前路径是否匹配目标路径
    if (normalizedCurrent === normalizedTarget) {
      return [...breadcrumbs, currentBreadcrumb];
    }

    // 如果有子项，递归查找
    if (hasChildren(item)) {
      const result = getBreadcrumbItems(
        item.children,
        targetPath,
        currentPath,
        [...breadcrumbs, currentBreadcrumb]
      );
      if (result !== null) {
        return result;
      }
    }
  }
  return null;
};

const BreadcrumbNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const menuList = useMenuStore((state) => state.menuList);

  const breadcrumbItems = useMemo(() => {
    const items = getBreadcrumbItems(menuList, location.pathname);

    if (!items || items.length === 0) return [];

    return items.map((item) => ({
      title: item.title,
      onClick: () => navigate(item.path),
    }));
  }, [menuList, location.pathname, navigate]);

  return <Breadcrumb items={breadcrumbItems} />;
};

export default BreadcrumbNav;
