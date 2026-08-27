import { useEffect } from "react";
import { Dropdown } from "antd";
import { SunOutlined, MoonOutlined, DesktopOutlined } from "@ant-design/icons";
import type { MenuProps } from "antd";
import { useTranslation } from "react-i18next";
import {
  getEffectiveTheme,
  getSystemTheme,
  useThemeStore,
} from "@/store/themeStore";
import {
  injectViewTransitionStyle,
  toggleThemeWithTransition,
} from "@/hooks/useThemeTransition";

const IconStyle =
  "text-xl cursor-pointer text-black/80 p-2 hover:bg-black/10 rounded-md dark:text-white! dark:hover:bg-white/10 transition-all duration-300";

const ThemeSwitcher = () => {
  const { t } = useTranslation();
  const { theme, setTheme } = useThemeStore();
  const effectiveTheme = getEffectiveTheme(theme);

  useEffect(() => {
    injectViewTransitionStyle();
  }, []);

  const themeMenuItems: MenuProps["items"] = [
    { key: "light", label: t("theme.light"), icon: <SunOutlined /> },
    { key: "dark", label: t("theme.dark"), icon: <MoonOutlined /> },
    {
      key: "system",
      label: t("theme.system"),
      icon: <DesktopOutlined />,
    },
  ];

  const getThemeIcon = () => {
    if (theme === "system") return <DesktopOutlined className={IconStyle} />;
    return theme === "dark" ? (
      <MoonOutlined className={IconStyle} />
    ) : (
      <SunOutlined className={IconStyle} />
    );
  };

  // 与 ant-design 官网一致用 onClick
  const handleThemeClick: MenuProps["onClick"] = ({ key, domEvent }) => {
    const event = domEvent as React.MouseEvent<HTMLElement>;

    if (key === "system") {
      const systemTheme = getSystemTheme();
      if (systemTheme !== effectiveTheme) {
        toggleThemeWithTransition(event, effectiveTheme === "dark", {
          setPreferenceToSystem: true,
        });
      } else {
        setTheme("system");
      }
      return;
    }

    const targetTheme = key as "light" | "dark";
    if (targetTheme === theme) return;

    if (targetTheme !== effectiveTheme) {
      toggleThemeWithTransition(event, effectiveTheme === "dark");
    } else {
      setTheme(targetTheme);
    }
  };

  return (
    <Dropdown
      menu={{
        items: themeMenuItems,
        selectable: true,
        selectedKeys: [theme],
        onClick: handleThemeClick,
      }}
      placement="bottomRight"
    >
      {getThemeIcon()}
    </Dropdown>
  );
};

export default ThemeSwitcher;
