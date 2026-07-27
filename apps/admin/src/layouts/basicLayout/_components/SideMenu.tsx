import { useNavigate, useLocation } from "react-router-dom";
import { Menu, Skeleton } from "antd";
import { isEqual } from "lodash";
import { setOpenKeys, useMenuStore } from "@/store/menuStore";
import type { ItemType } from "antd/es/menu/interface";
import { useEffect } from "react";
import { findMenuKeysByPath } from "@/utils/menuItems";

const skeletonItems: ItemType[] = Array.from({ length: 4 }, (_, i) => ({
  key: `skeleton-${i + 1}`,
  label: <Skeleton.Button active size="small" block />,
  icon: null,
}));

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
    if (key.startsWith("/")) navigate(key);
  };

  const handleOpenChange = (keys: string[]) => {
    if (isEqual(openKeys, keys)) return;
    setOpenKeys(keys);
  };

  const displayItems = menuLoading ? skeletonItems : menuList;

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
