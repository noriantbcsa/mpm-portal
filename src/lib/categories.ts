import "server-only";

import { cache } from "react";

import { prisma } from "@/lib/prisma";

export const getCategoryTree = cache(async (options?: { includeHidden?: boolean }) => {
  const includeHidden = options?.includeHidden ?? false;
  const categories = await prisma.category.findMany({
    where: includeHidden ? undefined : { isVisible: true },
    orderBy: [{ order: "asc" }, { name: "asc" }],
  });

  const byParent = new Map<string | null, typeof categories>();
  for (const category of categories) {
    const key = category.parentId;
    byParent.set(key, [...(byParent.get(key) ?? []), category]);
  }

  type NodeType = (typeof categories)[number] & { children: NodeType[] };
  function build(parentId: string | null): NodeType[] {
    return (byParent.get(parentId) ?? []).map((category) => ({
      ...category,
      children: build(category.id),
    }));
  }

  return build(null);
});

export const getAllCategoriesFlat = cache(async (options?: { includeHidden?: boolean }) => {
  const includeHidden = options?.includeHidden ?? false;
  return prisma.category.findMany({
    where: includeHidden ? undefined : { isVisible: true },
    orderBy: [{ order: "asc" }, { name: "asc" }],
  });
});

export const getCategoryBySlug = cache(async (slug: string) => {
  return prisma.category.findUnique({ where: { slug } });
});

/** Aplana el árbol para un <select>, indentando subcategorías con "— ". */
export function buildCategoryOptions(
  categories: { id: string; name: string; parentId: string | null }[],
): { id: string; label: string }[] {
  const byParent = new Map<string | null, typeof categories>();
  for (const category of categories) {
    const key = category.parentId;
    byParent.set(key, [...(byParent.get(key) ?? []), category]);
  }

  const options: { id: string; label: string }[] = [];
  function walk(parentId: string | null, depth: number) {
    for (const category of byParent.get(parentId) ?? []) {
      options.push({ id: category.id, label: `${"— ".repeat(depth)}${category.name}` });
      walk(category.id, depth + 1);
    }
  }
  walk(null, 0);
  return options;
}

/** IDs de la categoría y todas sus subcategorías (para filtrar productos). */
export async function getCategorySubtreeIds(categoryId: string): Promise<string[]> {
  const all = await prisma.category.findMany({ select: { id: true, parentId: true } });
  const byParent = new Map<string | null, string[]>();
  for (const c of all) {
    byParent.set(c.parentId, [...(byParent.get(c.parentId) ?? []), c.id]);
  }
  const result: string[] = [categoryId];
  const queue = [categoryId];
  while (queue.length) {
    const current = queue.shift()!;
    const children = byParent.get(current) ?? [];
    for (const child of children) {
      result.push(child);
      queue.push(child);
    }
  }
  return result;
}
