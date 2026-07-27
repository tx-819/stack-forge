import { Navigate, useLocation, useOutlet } from "react-router-dom";
import { useUserStore } from "@/store/userStore";
import { useMenuStore } from "@/store/menuStore";
import { normalizeMenuPath } from "@/utils/menuItems";
import Forbidden403 from "@/components/Forbidden403";
import RouteTransition from "./RouteTransition";

const AnimatedOutlet = () => {
  const outlet = useOutlet();
  return <RouteTransition>{outlet}</RouteTransition>;
};

const MenuRouteGuard = () => {
  const location = useLocation();
  const { pathname } = location;
  const isLogin = useUserStore((s) => s.isLogin);
  const isSuper = useUserStore((s) => s.isSuper);
  const menuLoading = useMenuStore((s) => s.menuLoading);
  const allowedPathnames = useMenuStore((s) => s.allowedPathnames);

  if (!isLogin) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (menuLoading) {
    return <AnimatedOutlet />;
  }

  if (isSuper) {
    return <AnimatedOutlet />;
  }

  const normalized = normalizeMenuPath(pathname);
  if (allowedPathnames.includes(normalized)) {
    return <AnimatedOutlet />;
  }

  return <Forbidden403 />;
};

export default MenuRouteGuard;
