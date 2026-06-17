export interface TreeNodeLike {
  id: number;
  parentId?: number | null;
  children?: TreeNodeLike[] | null;
}

export function buildTree<T extends TreeNodeLike>(items: T[]): T[] {
  const nodeMap = new Map<number, T & { children: T[] }>();
  const roots: T[] = [];

  for (const item of items) {
    nodeMap.set(item.id, { ...item, children: item.children ?? [] } as T & {
      children: T[];
    });
  }

  for (const node of nodeMap.values()) {
    if (node.parentId !== null && node.parentId !== undefined) {
      const parent = nodeMap.get(node.parentId);
      if (parent) {
        parent.children.push(node);
        continue;
      }
    }

    roots.push(node);
  }

  return roots;
}
