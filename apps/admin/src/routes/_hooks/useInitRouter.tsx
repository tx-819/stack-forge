import { useMemo } from "react";
import buildRoutes from "../buildRoutes";
import { createBrowserRouter } from "react-router-dom";

const useInitRouter = () => {
  const router = useMemo(() => {
    const routes = buildRoutes();
    return createBrowserRouter(routes);
  }, []);

  return router;
};

export default useInitRouter;
