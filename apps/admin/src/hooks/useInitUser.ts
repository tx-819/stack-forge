import { getAuthActions, getCurrentUser, getUserMenus } from "@/api/auth";
import { useEffect } from "react";
import { useUserStore } from "@/store/userStore";
import { setMenuList } from "@/store/menuStore";

async function fetchUserAndMenus() {
  const [user, userMenus, authActions] = await Promise.all([
    getCurrentUser(),
    getUserMenus(),
    getAuthActions(),
  ]);
  return { user, userMenus, authActions };
}

const useInitUser = () => {
  const isLogin = useUserStore((s) => s.isLogin);
  const setUser = useUserStore((s) => s.setUser);
  const setAuthActions = useUserStore((s) => s.setAuthActions);
  useEffect(() => {
    if (!isLogin) return;
    let cancelled = false;
    fetchUserAndMenus()
      .then(({ user, userMenus, authActions }) => {
        if (cancelled) return;
        setUser(user);
        setMenuList(userMenus);
        setAuthActions(authActions);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error(err);
        setMenuList([]);
      });
    return () => {
      cancelled = true;
    };
  }, [isLogin, setUser, setAuthActions]);
};

export default useInitUser;
