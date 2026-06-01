export interface RouteConfig {
  path: string;
  component?: string;
  children?: RouteConfig[];
  lazy?: boolean;
  redirect?: string;
}

export default [
  {
    path: "/login",
    component: "/login",
  },
  {
    path: "/login-success",
    component: "/login-success",
  },
  {
    path: "/register",
    component: "/register",
  },
  {
    path: "/",
    component: "../layouts/basicLayout",
    children: [
      {
        path: "/",
        redirect: "/dashboard/console",
      },
      {
        path: "/dashboard",
        children: [
          {
            path: "console",
            component: "/dashboard/console",
          },
        ],
      },
      {
        path: "/system",
        children: [
          {
            path: "users",
            component: "/system/users",
          },
          {
            path: "roles",
            component: "/system/roles",
          },
          {
            path: "permission",
            component: "/system/permission",
          },
        ],
      },
      {
        path: "*",
        component: "/not-found",
      },
    ],
  },
] as RouteConfig[];
