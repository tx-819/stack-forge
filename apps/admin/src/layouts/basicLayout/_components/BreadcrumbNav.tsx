import { useLocation, useNavigate } from "react-router-dom";
import { Breadcrumb } from "antd";
import { useMenuStore } from "@/store/menuStore";
import { useMemo } from "react";
import { findBreadcrumbItems } from "@/utils/menuItems";

const BreadcrumbNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const menuList = useMenuStore((state) => state.menuList);

  const breadcrumbItems = useMemo(() => {
    const items = findBreadcrumbItems(menuList, location.pathname);
    if (!items) return [];

    return items.map((item) => ({
      title: item.title,
      onClick: () => navigate(item.path),
    }));
  }, [menuList, location.pathname, navigate]);

  return <Breadcrumb items={breadcrumbItems} />;
};

export default BreadcrumbNav;
