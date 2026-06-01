import { Button, Result } from "antd";
import { useNavigate } from "react-router-dom";
import { useMenuStore } from "@/store/menuStore";

const DEFAULT_FALLBACK = "/dashboard/console";

const Forbidden403 = () => {
  const navigate = useNavigate();
  const firstAllowed = useMenuStore((s) => s.allowedPathnames[0]);

  return (
    <Result
      status="403"
      title="403"
      subTitle="您没有权限访问该页面。"
      extra={
        <Button
          type="primary"
          onClick={() => navigate(firstAllowed ?? DEFAULT_FALLBACK, { replace: true })}
        >
          返回
        </Button>
      }
    />
  );
};

export default Forbidden403;
