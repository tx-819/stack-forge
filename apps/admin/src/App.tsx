import { RouterProvider } from "react-router-dom";
import useInitUser from "./hooks/useInitUser";
import { useInitRouter } from "./routes";
import AntdConfigProvider from "./components/AntdConfigProvider";
import QueryClientProvider from "./components/QueryClientProvider";

function App() {
  useInitUser();
  const router = useInitRouter();

  return (
    <QueryClientProvider>
      <AntdConfigProvider>
        <RouterProvider router={router} />
      </AntdConfigProvider>
    </QueryClientProvider>
  );
}

export default App;
