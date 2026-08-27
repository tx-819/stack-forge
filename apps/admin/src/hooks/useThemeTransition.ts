/**
 * 亮色/暗色切换 - 从点击位置圆形扩散动画
 * 基于 View Transitions API + clip-path
 *
 * 注意：clip-path 的 at x y 是相对于被裁剪元素（::view-transition-*）的盒子，
 * 不是直接等于鼠标的 clientX/Y。用「视口百分比」定位，才能和点击位置对齐。
 */

import { useCallback } from "react";
import { flushSync } from "react-dom";
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

/** 关闭 UA 默认淡入淡出，并用 z-index 控制明暗切换时新旧层叠顺序 */
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

export function injectViewTransitionStyle(): void {
  if (typeof document.startViewTransition === "function") {
    injectCSS(viewTransitionStyle, STYLE_ID_VIEW_TRANSITION);
  }
}

export interface ThemeTransitionOptions {
  setPreferenceToSystem?: boolean;
}

/**
 * 把鼠标视口坐标换成 clip-path 可用的百分比圆心。
 * circle(... at X% Y%) 的百分比相对「被裁剪元素」宽高；
 * VT 的 root 伪元素覆盖视口，因此 client / inner* 100% 才能对准点击点。
 */
function toClipOrigin(clientX: number, clientY: number) {
  const w = window.innerWidth || 1;
  const h = window.innerHeight || 1;
  return {
    x: `${(clientX / w) * 100}%`,
    y: `${(clientY / h) * 100}%`,
    // 半径用超大百分比，保证盖住视口任意角落
    endRadius: "150%",
  };
}

function readClientPoint(
  event: React.MouseEvent<HTMLElement, MouseEvent> | MouseEvent,
): { x: number; y: number } | null {
  // 优先用事件自身的 clientX/Y（antd 下拉里比 nativeEvent 更稳）
  const x = event.clientX;
  const y = event.clientY;
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  return { x, y };
}

export function toggleThemeWithTransition(
  event: React.MouseEvent<HTMLElement, MouseEvent> | MouseEvent,
  isCurrentlyDark: boolean,
  options?: ThemeTransitionOptions,
): void {
  const nextTheme: ThemeMode = options?.setPreferenceToSystem
    ? getSystemTheme()
    : isCurrentlyDark
      ? "light"
      : "dark";
  const preferenceAfterTransition = options?.setPreferenceToSystem
    ? "system"
    : nextTheme;

  const point = readClientPoint(event);
  const canAnimate =
    point &&
    typeof document.startViewTransition === "function" &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!canAnimate) {
    useThemeStore.getState().setTheme(preferenceAfterTransition);
    return;
  }

  const { x, y, endRadius } = toClipOrigin(point.x, point.y);
  const clipPath = [
    `circle(0px at ${x} ${y})`,
    `circle(${endRadius} at ${x} ${y})`,
  ];

  injectViewTransitionStyle();

  const transition = document.startViewTransition(() => {
    flushSync(() => {
      useThemeStore.getState().setTheme(preferenceAfterTransition);
    });
  });

  transition.ready.then(() => {
    injectCSS("* { transition: none !important }", STYLE_ID_DISABLE_TRANSITION);

    // 亮→暗：展开 new；暗→亮：收缩 old（配合上面的 z-index 翻转）
    const animation = document.documentElement.animate(
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
    );

    animation.finished.finally(() => {
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
