import { ConfigProvider, theme as antdTheme } from "antd";
import { useTranslation } from "react-i18next";
import type { ReactNode } from "react";
import { useState, useEffect } from "react";
import { getEffectiveTheme, useThemeStore } from "@/store/themeStore";
import type { Locale } from "antd/es/locale";

// 语言包按需加载，避免同时打包 zh + en（约节省 20-50KB）
const localeLoaders: Record<string, () => Promise<{ default: Locale }>> = {
  zh: () => import("antd/locale/zh_CN"),
  en: () => import("antd/locale/en_US"),
};

interface AntdConfigProviderProps {
  children: ReactNode;
}

const AntdConfigProvider = ({ children }: AntdConfigProviderProps) => {
  const { i18n } = useTranslation();
  const theme = useThemeStore((s) => s.theme);
  const effectiveTheme = getEffectiveTheme(theme);
  const currentLanguage = (i18n.language || "zh").split("-")[0];
  const [antdLocale, setAntdLocale] = useState<Locale | null>(null);

  useEffect(() => {
    const loadLocale = localeLoaders[currentLanguage] ?? localeLoaders.zh;
    loadLocale().then((m) => setAntdLocale(m.default));
  }, [currentLanguage]);

  return (
    <ConfigProvider
      theme={{
        algorithm:
          effectiveTheme === "dark"
            ? antdTheme.darkAlgorithm
            : antdTheme.defaultAlgorithm,
        components: {
          Layout: {
            headerPadding: "calc(var(--spacing) * 6)",
          },
        },
      }}
      locale={antdLocale ?? undefined}
    >
      {children}
    </ConfigProvider>
  );
};

export default AntdConfigProvider;
