import type { MenuRecord } from "@/api/permission";

/** Trim trailing slashes (except root) and ensure leading `/`. */
export function normalizeMenuPath(path: string): string {
  const trimmed = path.trim();
  const withSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  if (withSlash === "/") return "/";
  return withSlash.replace(/\/+$/, "") || "/";
}

/**
 * Join parent full path with a menu segment (same idea as SideMenu: parent + "/" + key).
 * Absolute `segment` (leading `/`) is treated as a full path and ignores `parentFull`.
 */
export function joinToFullMenuPath(parentFull: string, segment: string): string {
  const s = segment.trim();
  if (!s) return parentFull;
  if (s.startsWith("/")) {
    return normalizeMenuPath(s);
  }
  if (!parentFull) {
    return normalizeMenuPath(`/${s}`);
  }
  return normalizeMenuPath(`${parentFull}/${s}`.replace(/\/+/g, "/"));
}

/**
 * DFS collect of every node's **full** path (parent + child segments), normalize and dedupe.
 * Matches how the sidebar resolves `location.pathname` for nested menus.
 */
export function collectNormalizedMenuPaths(menus: MenuRecord[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];

  const walk = (nodes: MenuRecord[], parentFull: string) => {
    for (const n of nodes) {
      let fullForChildren = parentFull;
      if (n.path) {
        fullForChildren = joinToFullMenuPath(parentFull, n.path);
        if (!seen.has(fullForChildren)) {
          seen.add(fullForChildren);
          out.push(fullForChildren);
        }
      }
      if (n.children?.length) walk(n.children, fullForChildren);
    }
  };

  walk(menus, "");
  return out;
}
