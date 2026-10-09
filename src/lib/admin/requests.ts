import "server-only";

import type { Prisma, CartRequestStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { CurrentUser } from "@/lib/auth/dal";

export type RequestFilters = {
  status?: CartRequestStatus;
  assignedToId?: string | "unassigned";
  q?: string;
  page?: number;
  pageSize?: number;
};

type RequestViewer = Pick<CurrentUser, "id" | "role">;

/**
 * Los asesores no trabajan con una bandeja compartida: solo reciben las
 * solicitudes que un administrador les asignó. La restricción vive en la
 * consulta (no solo en la pantalla), para que una URL manipulada tampoco
 * revele información de otro cliente.
 */
function restrictToViewer(where: Prisma.CartRequestWhereInput, viewer?: RequestViewer) {
  if (viewer?.role !== "SALES") return where;
  return { ...where, assignedToId: viewer.id } satisfies Prisma.CartRequestWhereInput;
}

export async function listCartRequests(filters: RequestFilters = {}, viewer?: RequestViewer) {
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

  const scopedWhere = restrictToViewer(where, viewer);
  const include = {
    assignedTo: { select: { id: true, name: true } },
    items: true,
  } satisfies Prisma.CartRequestInclude;
  const orderBy = { createdAt: "desc" } satisfies Prisma.CartRequestOrderByWithRelationInput;

  const [firstItems, total] = await Promise.all([
    prisma.cartRequest.findMany({
      where: scopedWhere,
      include,
      orderBy,
      skip: (requestedPage - 1) * pageSize,
      take: pageSize,
    }),
    prisma.cartRequest.count({ where: scopedWhere }),
  ]);

  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  // Igual que en listProducts: una página fuera de rango sirve la última
  // válida en vez de una tabla vacía con "Página 13 de 12".
  const page = Math.min(requestedPage, pageCount);
  const items =
    page === requestedPage
      ? firstItems
      : await prisma.cartRequest.findMany({
          where: scopedWhere,
          include,
          orderBy,
          skip: (page - 1) * pageSize,
          take: pageSize,
        });

  return { items, total, page, pageSize, pageCount };
}

export async function getCartRequestById(id: string, viewer?: RequestViewer) {
  return prisma.cartRequest.findFirst({
    where: restrictToViewer({ id }, viewer),
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
