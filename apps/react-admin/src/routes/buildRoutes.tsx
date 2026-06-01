import { Suspense, type ReactElement } from "react";
import { Navigate, Outlet } from "react-router";
import type { RouteObject } from "react-router-dom";
import NProgressFallback from "../components/NProgressFallback";
import renderComponent from "../utils/renderComponent";
import routesConfig, { type RouteConfig } from "./config";

function elementForComponent(component: string): ReactElement | null {
  const Component = renderComponent(component);
  if (!Component) return null;
  return (
    <Suspense fallback={<NProgressFallback />}>
      <Component />
    </Suspense>
  );
}

/** 将 `RouteConfig` 转为 react-router-dom 的 `RouteObject[]` */
const transformRoutes = (routes: RouteConfig[]): RouteObject[] => {
  return routes.map((route): RouteObject => {
    if (route.redirect && !route.component) {
      if (route.path === "/" || route.path === "") {
        return {
          index: true,
          element: <Navigate to={route.redirect} replace />,
        };
      }
      return {
        path: route.path,
        element: <Navigate to={route.redirect} replace />,
      };
    }

    const routeItem: RouteObject = { path: route.path };

    if (route.component) {
      const el = elementForComponent(route.component);
      if (el) routeItem.element = el;
    }

    if (route.children?.length) {
      const childRoutes = transformRoutes(route.children);
      if (childRoutes.length) {
        routeItem.children = childRoutes;
        if (!routeItem.element) routeItem.element = <Outlet />;
      }
    }

    return routeItem;
  });
};

export default function buildRoutes(): RouteObject[] {
  return transformRoutes(routesConfig);
}
