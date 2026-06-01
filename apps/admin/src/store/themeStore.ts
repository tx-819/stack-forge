import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeMode = "light" | "dark";

/** 用户偏好：亮色 / 暗色 / 跟随系统（按时间 7:00–19:00 亮色） */
export type ThemePreference = ThemeMode | "system";

const STORAGE_KEY = "app_theme";

/** 白天 7:00–19:00 亮色，其余时间暗色 */
export const getSystemTheme = (): ThemeMode => {
  if (typeof window === "undefined") return "light";
  const hour = new Date().getHours();
  return hour >= 7 && hour < 19 ? "light" : "dark";
};

/** 由偏好得到实际主题（供样式与 Ant Design 使用） */
export const getEffectiveTheme = (preference: ThemePreference): ThemeMode =>
  preference === "system" ? getSystemTheme() : preference;

export const setTailwindTheme = (theme: ThemeMode) => {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", theme === "dark");
};

interface PersistedState {
  state?: { theme?: ThemePreference };
}

export const applyThemeFromStorage = () => {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as PersistedState) : null;
    const preference = parsed?.state?.theme ?? "light";
    setTailwindTheme(getEffectiveTheme(preference));
  } catch {
    // 解析异常时保持默认亮色
  }
};

interface ThemeStore {
  theme: ThemePreference;
  setTheme: (theme: ThemePreference) => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      theme: "light",
      setTheme: (theme) => {
        set({ theme });
        setTailwindTheme(theme === "system" ? getSystemTheme() : theme);
      },
    }),
    { name: STORAGE_KEY },
  ),
);
