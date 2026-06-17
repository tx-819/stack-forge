export interface MenuPathNode {
  path?: string | null;
  children?: MenuPathNode[] | null;
}

export function normalizeMenuPath(path: string): string {
  const trimmed = path.trim();
  const withSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  if (withSlash === '/') return '/';
  return withSlash.replace(/\/+$/, '') || '/';
}

export function joinToFullMenuPath(parentFull: string, segment: string): string {
  const value = segment.trim();
  if (!value) return parentFull;
  if (value.startsWith('/')) {
    return normalizeMenuPath(value);
  }
  if (!parentFull) {
    return normalizeMenuPath(`/${value}`);
  }
  return normalizeMenuPath(`${parentFull}/${value}`.replace(/\/+/g, '/'));
}

export function collectNormalizedMenuPaths(menus: MenuPathNode[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];

  const walk = (nodes: MenuPathNode[], parentFull: string) => {
    for (const node of nodes) {
      let fullForChildren = parentFull;
      if (node.path) {
        fullForChildren = joinToFullMenuPath(parentFull, node.path);
        if (!seen.has(fullForChildren)) {
          seen.add(fullForChildren);
          out.push(fullForChildren);
        }
      }
      if (node.children?.length) walk(node.children, fullForChildren);
    }
  };

  walk(menus, '');
  return out;
}
