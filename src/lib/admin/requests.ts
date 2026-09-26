import "server-only";

import type { Prisma, CartRequestStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type RequestFilters = {
  status?: CartRequestStatus;
  assignedToId?: string | "unassigned";
  q?: string;
  page?: number;
  pageSize?: number;
};

export async function listCartRequests(filters: RequestFilters = {}) {
  const requestedPage = Math.max(1, filters.page ?? 1);
  const pageSize = filters.pageSize ?? 20;

  const where: Prisma.CartRequestWhereInput = {};
  if (filters.status) where.status = filters.status;
  if (filters.assignedToId === "unassigned") where.assignedToId = null;
  else if (filters.assignedToId) where.assignedToId = filters.assignedToId;
  if (filters.q) {
    where.OR = [
      { contactName: { contains: filters.q, mode: "insensitive" } },
      { contactPhone: { contains: filters.q, mode: "insensitive" } },
      { city: { contains: filters.q, mode: "insensitive" } },
      { companyName: { contains: filters.q, mode: "insensitive" } },
    ];
  }

  const include = {
    assignedTo: { select: { id: true, name: true } },
    items: true,
  } satisfies Prisma.CartRequestInclude;
  const orderBy = { createdAt: "desc" } satisfies Prisma.CartRequestOrderByWithRelationInput;

  const [firstItems, total] = await Promise.all([
    prisma.cartRequest.findMany({
      where,
      include,
      orderBy,
      skip: (requestedPage - 1) * pageSize,
      take: pageSize,
    }),
    prisma.cartRequest.count({ where }),
  ]);

  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  // Igual que en listProducts: una página fuera de rango sirve la última
  // válida en vez de una tabla vacía con "Página 13 de 12".
  const page = Math.min(requestedPage, pageCount);
  const items =
    page === requestedPage
      ? firstItems
      : await prisma.cartRequest.findMany({
          where,
          include,
          orderBy,
          skip: (page - 1) * pageSize,
          take: pageSize,
        });

  return { items, total, page, pageSize, pageCount };
}

export async function getCartRequestById(id: string) {
  return prisma.cartRequest.findUnique({
    where: { id },
    include: {
      assignedTo: { select: { id: true, name: true } },
      items: true,
      events: {
        include: { author: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function listSalesTeam() {
  return prisma.user.findMany({
    where: { active: true, role: { in: ["ADMIN", "SALES"] } },
    select: { id: true, name: true, role: true },
    orderBy: { name: "asc" },
  });
}
