import type { ItemType } from "antd/es/menu/interface";

export interface MenuPathNode {
  path?: string | null;
  children?: MenuPathNode[] | null;
}

export type MenuItemWithChildren = NonNullable<ItemType> & {
  children: ItemType[];
};

export type BreadcrumbTrailItem = { title: string; path: string };

export function normalizeMenuPath(path: string): string {
  const trimmed = path.trim();
  const withSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  if (withSlash === "/") return "/";
  return withSlash.replace(/\/+$/, "") || "/";
}

export function joinToFullMenuPath(parentFull: string, segment: string): string {
  const value = segment.trim();
  if (!value) return parentFull;
  if (value.startsWith("/")) {
    return normalizeMenuPath(value);
  }
  if (!parentFull) {
    return normalizeMenuPath(`/${value}`);
  }
  return normalizeMenuPath(`${parentFull}/${value}`.replace(/\/+/g, "/"));
}

export function collectNormalizedMenuPaths(menus: MenuPathNode[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];

  const walk = (nodes: MenuPathNode[], parentFull: string) => {
    for (const node of nodes) {
      let fullForChildren = parentFull;
      if (node.path) {
        fullForChildren = joinToFullMenuPath(parentFull, node.path);
        if (!seen.has(fullForChildren)) {
          seen.add(fullForChildren);
          out.push(fullForChildren);
        }
      }
      if (node.children?.length) walk(node.children, fullForChildren);
    }
  };

  walk(menus, "");
  return out;
}

export function hasMenuChildren(
  item: ItemType
): item is MenuItemWithChildren {
  return (
    !!item &&
    typeof item === "object" &&
    "children" in item &&
    Array.isArray(item.children) &&
    item.children.length > 0
  );
}

export function getMenuItemKey(item: NonNullable<ItemType>): string {
  return String(item.key ?? "");
}

export function getMenuItemLabel(item: NonNullable<ItemType>): string {
  if ("label" in item && typeof item.label === "string") return item.label;
  return getMenuItemKey(item);
}

function isRouteKey(key: string): boolean {
  return key.startsWith("/");
}

export function findMenuKeysByPath(
  menuList: ItemType[],
  targetPath: string,
  parentKeys: string[] = []
): { selectedKey: string; openKeys: string[] } | null {
  const normalizedTarget = normalizeMenuPath(targetPath);

  for (const item of menuList) {
    if (!item) continue;
    const itemKey = getMenuItemKey(item);

    if (isRouteKey(itemKey) && normalizeMenuPath(itemKey) === normalizedTarget) {
      return { selectedKey: itemKey, openKeys: parentKeys };
    }

    if (hasMenuChildren(item)) {
      const found = findMenuKeysByPath(item.children, targetPath, [
        ...parentKeys,
        itemKey,
      ]);
      if (found) return found;
    }
  }
  return null;
}

/** 面包屑点击目标：有子菜单时进第一个子项，否则进自身路由 */
function getBreadcrumbClickPath(item: NonNullable<ItemType>): string {
  if (hasMenuChildren(item)) {
    const firstChild = item.children.find(Boolean);
    return firstChild ? getMenuItemKey(firstChild) : "";
  }
  const key = getMenuItemKey(item);
  return isRouteKey(key) ? key : "";
}

/**
 * 在菜单树中定位 targetPath，返回从根到该节点的面包屑。
 * 未找到返回 null。
 */
export function findBreadcrumbItems(
  menuList: ItemType[],
  targetPath: string,
  trail: BreadcrumbTrailItem[] = []
): BreadcrumbTrailItem[] | null {
  const target = normalizeMenuPath(targetPath);

  for (const item of menuList) {
    if (!item) continue;

    const key = getMenuItemKey(item);
    const nextTrail = [
      ...trail,
      { title: getMenuItemLabel(item), path: getBreadcrumbClickPath(item) },
    ];

    if (isRouteKey(key) && normalizeMenuPath(key) === target) {
      return nextTrail;
    }

    if (hasMenuChildren(item)) {
      const found = findBreadcrumbItems(item.children, targetPath, nextTrail);
      if (found) return found;
    }
  }

  return null;
}
