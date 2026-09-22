import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import type { CartRequestStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

export type RequestFilters = {
  status?: CartRequestStatus;
  assignedToId?: string | "unassigned";
  q?: string;
  page?: number;
  pageSize?: number;
};

export async function listCartRequests(filters: RequestFilters = {}) {
  const page = Math.max(1, filters.page ?? 1);
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

  const [items, total] = await Promise.all([
    prisma.cartRequest.findMany({
      where,
      include: {
        assignedTo: { select: { id: true, name: true } },
        items: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.cartRequest.count({ where }),
  ]);

  return { items, total, page, pageSize, pageCount: Math.max(1, Math.ceil(total / pageSize)) };
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
