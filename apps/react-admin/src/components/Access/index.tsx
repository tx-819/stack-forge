import { useLocation } from "react-router-dom";
import { useUserStore } from "@/store/userStore";

interface AccessProps {
  children: React.ReactNode;
  code: string;
}

const Access = (props: AccessProps) => {
  const { children, code } = props;
  const { pathname } = useLocation();
  const isSuper = useUserStore((s) => s.isSuper);
  const authActions = useUserStore((s) => s.authActions);
  const entry = authActions.find((item) => item.pathname === pathname);
  const hasAccess = entry?.actions.some((a) => a.code === code) ?? false;

  if (isSuper) {
    return children;
  }
  if (!hasAccess) {
    return null;
  }
  return children;
};

export default Access;
