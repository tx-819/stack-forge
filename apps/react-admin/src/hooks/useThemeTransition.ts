/**
 * 亮色/暗色切换 - 从点击位置圆形扩散动画
 * 基于 View Transitions API + Web Animations API，与 themeStore 的 setTailwindTheme 对接
 */

import { useCallback } from "react";
import { getSystemTheme, useThemeStore } from "@/store/themeStore";
import type { ThemeMode } from "@/store/themeStore";

const DURATION_MS = 500;
const STYLE_ID_VIEW_TRANSITION = "view-transition-theme-style";
const STYLE_ID_DISABLE_TRANSITION = "theme-transition-disable";

function injectCSS(css: string, id: string): void {
  let el = document.getElementById(id) as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement("style");
    el.id = id;
    document.head.appendChild(el);
  }
  el.textContent = css;
}

function removeCSS(id: string): void {
  document.getElementById(id)?.remove();
}

const viewTransitionStyle = `
@keyframes keepAlive { 100% { z-index: -1 } }

::view-transition-old(root),
::view-transition-new(root) {
  animation: keepAlive ${DURATION_MS / 1000}s linear;
  animation-fill-mode: forwards;
  mix-blend-mode: normal;
}

.dark::view-transition-old(root) { z-index: 1; }
.dark::view-transition-new(root) { z-index: 999; }

::view-transition-old(root) { z-index: 999; }
::view-transition-new(root) { z-index: 1; }
`;

/**
 * 注入 View Transition 全局样式，页面加载时执行一次（如在 Layout 或根组件 useEffect 中调用）
 */
export function injectViewTransitionStyle(): void {
  if (typeof document.startViewTransition === "function") {
    injectCSS(viewTransitionStyle, STYLE_ID_VIEW_TRANSITION);
  }
}

export interface ThemeTransitionOptions {
  /** 动画结束后将偏好设为「跟随系统」 */
  setPreferenceToSystem?: boolean;
}

/**
 * 带圆形扩散的主题切换。state 会在 transition 的 callback 内同步更新，避免截「旧」帧时 React 已按新主题重渲染。
 * @param event 点击事件，用于取 clientX/clientY
 * @param isCurrentlyDark 当前是否为暗色（即将切到亮色则为 true）
 * @param options setPreferenceToSystem 为 true 时，下一主题为 getSystemTheme()，且动画结束后将 theme 设为 "system"
 */
export function toggleThemeWithTransition(
  event: React.MouseEvent<HTMLElement, MouseEvent> | MouseEvent,
  isCurrentlyDark: boolean,
  options?: ThemeTransitionOptions,
): void {
  const nativeEvent =
    event && "nativeEvent" in event
      ? (event as React.MouseEvent<HTMLElement>).nativeEvent
      : (event as MouseEvent);
  const nextTheme: ThemeMode = options?.setPreferenceToSystem
    ? getSystemTheme()
    : isCurrentlyDark
      ? "light"
      : "dark";
  const preferenceAfterTransition = options?.setPreferenceToSystem
    ? "system"
    : nextTheme;

  if (!nativeEvent || typeof document.startViewTransition !== "function") {
    useThemeStore.getState().setTheme(preferenceAfterTransition);
    return;
  }

  const { clientX: x, clientY: y } = nativeEvent;
  const endRadius = Math.hypot(
    Math.max(x, innerWidth - x),
    Math.max(y, innerHeight - y),
  );

  const transition = document.startViewTransition(() => {
    useThemeStore.getState().setTheme(preferenceAfterTransition);
  });

  transition.ready.then(() => {
    const clipPath = [
      `circle(0px at ${x}px ${y}px)`,
      `circle(${endRadius}px at ${x}px ${y}px)`,
    ];

    injectCSS("* { transition: none !important }", STYLE_ID_DISABLE_TRANSITION);

    document.documentElement
      .animate(
        {
          clipPath: isCurrentlyDark ? [...clipPath].reverse() : clipPath,
        },
        {
          duration: DURATION_MS,
          easing: "ease-in",
          pseudoElement: isCurrentlyDark
            ? "::view-transition-old(root)"
            : "::view-transition-new(root)",
        },
      )
      .addEventListener("finish", () => {
        removeCSS(STYLE_ID_DISABLE_TRANSITION);
      });
  });
}

export function useThemeTransition(isDark: boolean) {
  const toggle = useCallback(
    (e: React.MouseEvent<HTMLElement, MouseEvent> | MouseEvent) => {
      toggleThemeWithTransition(e, isDark);
    },
    [isDark],
  );
  return toggle;
}
