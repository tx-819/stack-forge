import { useLocation, useOutlet } from "react-router-dom";
import { useUserStore } from "@/store/userStore";
import { useMenuStore } from "@/store/menuStore";
import { normalizeMenuPath } from "@/utils/menuPaths";
import Forbidden403 from "@/components/Forbidden403";
import RouteTransition from "./RouteTransition";

const AnimatedOutlet = () => {
  const outlet = useOutlet();
  return <RouteTransition>{outlet}</RouteTransition>;
};

const MenuRouteGuard = () => {
  const { pathname } = useLocation();
  const isLogin = useUserStore((s) => s.isLogin);
  const isSuper = useUserStore((s) => s.isSuper);
  const menuLoading = useMenuStore((s) => s.menuLoading);
  const allowedPathnames = useMenuStore((s) => s.allowedPathnames);

  if (!isLogin) {
    return <AnimatedOutlet />;
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
