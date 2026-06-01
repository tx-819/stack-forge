import { useNavigate, useLocation } from "react-router-dom";
import { Menu, Skeleton } from "antd";
import { isObject, isArray, get, isEmpty, map, omit, reduce, startsWith, trimEnd, compact, isEqual } from "lodash";
import { setOpenKeys, useMenuStore } from "@/store/menuStore";
import type { ItemType } from "antd/es/menu/interface";
import { useMemo, useEffect } from "react";

const hasChildren = (
  item: ItemType
): item is ItemType & { children: ItemType[] } =>
  isObject(item) && isArray(get(item, "children")) && !isEmpty(get(item, "children"));

// children 为 null 或空数组时不渲染为 submenu
const normalizeMenuItems = (items: ItemType[]): ItemType[] =>
  map(items, (item) => {
    if (!item || !isObject(item)) return item;
    const children = get(item, "children");
    if (children == null || isEmpty(children)) return omit(item, "children") as ItemType;
    return { ...item, children: normalizeMenuItems(children) };
  });

const getFullPath = (
  menuList: ItemType[],
  key: string,
  parentPath = ""
): string | null =>
  reduce(
    menuList,
    (acc, item) => {
      if (acc !== null || !item) return acc;
      const itemKey = get(item, "key", "")?.toString() || "";
      const currentPath = parentPath ? `${parentPath}/${itemKey}` : itemKey;
      if (itemKey === key) return currentPath;
      if (hasChildren(item)) return getFullPath(item.children, key, currentPath);
      return null;
    },
    null as string | null
  );

// 根据路径查找菜单 key 和父级 keys
const normalizePath = (path: string) => {
  const normalized = trimEnd(path, "/");
  return startsWith(normalized, "/") ? normalized : `/${normalized}`;
};

const findMenuKeysByPath = (
  menuList: ItemType[],
  targetPath: string,
  parentPath = "",
  parentKeys: string[] = []
): { selectedKey: string | null; openKeys: string[] } | null =>
  reduce(
    menuList,
    (acc, item) => {
      if (acc !== null || !item) return acc;
      const itemKey = get(item, "key", "")?.toString() || "";
      const currentPath = parentPath
        ? `${parentPath}/${itemKey}`.replace(/\/+/g, "/")
        : `/${itemKey}`;
      const normalizedCurrent = normalizePath(currentPath);
      const normalizedTarget = normalizePath(targetPath);

      if (normalizedCurrent === normalizedTarget) {
        return { selectedKey: itemKey, openKeys: parentKeys };
      }
      if (hasChildren(item)) {
        return findMenuKeysByPath(
          item.children,
          targetPath,
          currentPath,
          compact([...parentKeys, itemKey])
        );
      }
      return null;
    },
    null as { selectedKey: string | null; openKeys: string[] } | null
  );

const SideMenu = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { menuList, menuLoading, collapsed, selectedKey, openKeys } =
    useMenuStore();

  useEffect(() => {
    const result = findMenuKeysByPath(menuList, location.pathname);
    const newSelectedKey = result?.selectedKey ?? "";
    const newOpenKeys = collapsed ? [] : (result?.openKeys ?? []);

    useMenuStore.setState((state) => {
      if (
        state.selectedKey === newSelectedKey &&
        isEqual(state.openKeys, newOpenKeys)
      ) {
        return state;
      }
      return { selectedKey: newSelectedKey, openKeys: newOpenKeys };
    });
  }, [menuList, location.pathname, collapsed]);

  const handleMenuClick = ({ key }: { key: string }) => {
    const fullPath = getFullPath(menuList, key);
    if (fullPath) navigate(`/${fullPath}`);
  };

  const handleOpenChange = (keys: string[]) => {
    if (isEqual(openKeys, keys)) return;
    setOpenKeys(keys);
  };

  const normalizedItems = useMemo(
    () => normalizeMenuItems(menuList),
    [menuList]
  );

  // 菜单加载中时展示骨架项
  const skeletonItems: ItemType[] = [
    {
      key: "skeleton-1",
      label: <Skeleton.Button active size="small" block />,
      icon: null,
    },
    {
      key: "skeleton-2",
      label: <Skeleton.Button active size="small" block />,
      icon: null,
    },
    {
      key: "skeleton-3",
      label: <Skeleton.Button active size="small" block />,
      icon: null,
    },
    {
      key: "skeleton-4",
      label: <Skeleton.Button active size="small" block />,
      icon: null,
    },
  ];

  const displayItems = menuLoading ? skeletonItems : normalizedItems;

  return (
    <Menu
      theme="light"
      mode="inline"
      items={displayItems}
      disabled={menuLoading}
      inlineCollapsed={collapsed}
      selectedKeys={selectedKey ? [selectedKey] : []}
      openKeys={openKeys}
      onOpenChange={handleOpenChange}
      onClick={handleMenuClick}
    />
  );
};

export default SideMenu;
