import { connectOrSkip } from "./test-db";
import { afterAll, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { saveCategoryAction } from "@/app/admin/categorias/actions";
import { saveProductAction } from "@/app/admin/productos/actions";
import { saveCampaignAction } from "@/app/admin/campanas/actions";
import { getLiveCampaignBySlug } from "@/lib/campaigns";

vi.mock("@/lib/auth/dal", () => ({ requireRole: async () => ({ id: "audit-admin", role: "ADMIN" }) }));
vi.mock("next/navigation", () => ({ redirect: (url: string) => { throw new Error(`NEXT_REDIRECT:${url}`); } }));
const available = await connectOrSkip(prisma);
const prefix = `audit-${Date.now()}`;
const categoryIds: string[] = [], productIds: string[] = [], campaignIds: string[] = [];
function form(fields: Record<string, string | string[]>) {
  const data = new FormData();
  for (const [key, values] of Object.entries(fields)) for (const value of Array.isArray(values) ? values : [values]) data.append(key, value);
  return data;
}

afterAll(async () => {
  if (!available) return;
  await prisma.product.deleteMany({ where: { id: { in: productIds } } });
  await prisma.campaign.deleteMany({ where: { id: { in: campaignIds } } });
  for (const id of [...categoryIds].reverse()) await prisma.category.delete({ where: { id } });
  await prisma.$disconnect();
});

describe.skipIf(!available)("administración con PostgreSQL real", () => {
  it("crea categoría, producto y campaña conservando precios, fotos y variantes", async () => {
    const name = `${prefix} categoría`;
    await expect(saveCategoryAction({ status: "idle" }, form({ name, isVisible: "on", order: "0" }))).rejects.toThrow("NEXT_REDIRECT");
    const category = await prisma.category.findFirstOrThrow({ where: { name } });
    categoryIds.push(category.id);
    await expect(saveProductAction({ status: "idle" }, form({
      name: `${prefix} camisa`, sku: prefix, description: "Camisa de prueba de auditoría.", categoryId: category.id,
      audience: "MUJER", status: "DISPONIBLE", sizesText: "S, S, M", colorsText: "V. PINO, PINO",
      priceRef: "65000", priceWholesale: "35000", images: JSON.stringify([{ url: "/catalogo/audit.webp", alt: "", color: "Turquí", order: 8 }]),
    }))).rejects.toThrow("NEXT_REDIRECT");
    const product = await prisma.product.findUniqueOrThrow({ where: { sku: prefix }, include: { images: true } });
    productIds.push(product.id);
    expect(product.sizes).toEqual(["S", "M"]);
    expect(product.colors).toEqual(["Verde Pino", "Turquí"]);
    expect(Number(product.priceWholesale)).toBe(35000);
    expect(product.images[0]).toMatchObject({ color: "Turquí", order: 0 });
    expect(product.images[0].alt).toContain("camisa");
    await expect(saveCampaignAction({ status: "idle" }, form({ name: `${prefix} campaña`, productIds: [product.id, product.id], priorityCategoryIds: category.id }))).rejects.toThrow("NEXT_REDIRECT");
    const campaign = await prisma.campaign.findFirstOrThrow({ where: { name: `${prefix} campaña` } });
    campaignIds.push(campaign.id);
    expect((await prisma.product.findUniqueOrThrow({ where: { id: product.id } })).campaignId).toBe(campaign.id);
  });

  it("no crea una campaña parcial si una prenda fue borrada", async () => {
    const name = `${prefix} selección inválida`;
    const result = await saveCampaignAction({ status: "idle" }, form({ name, productIds: "no-existe" }));
    expect(result.status).toBe("error");
    expect(await prisma.campaign.count({ where: { name } })).toBe(0);
  });

  it("un registro eliminado produce un mensaje recuperable", async () => {
    expect(await saveCategoryAction({ status: "idle" }, form({ id: "no-existe", name: "Categoría eliminada" }))).toMatchObject({ status: "error", message: expect.stringContaining("ya no existe") });
  });

  it("una categoría borrada no altera a medias el producto existente", async () => {
    const product = await prisma.product.findUniqueOrThrow({ where: { id: productIds[0] } });
    const result = await saveProductAction({ status: "idle" }, form({
      id: product.id, sku: product.sku, name: product.name, description: product.description,
      categoryId: "categoría-eliminada", audience: "MUJER", status: "DISPONIBLE", images: "[]",
    }));
    expect(result).toMatchObject({ status: "error", fieldErrors: { categoryId: expect.any(String) } });
    const unchanged = await prisma.product.findUniqueOrThrow({ where: { id: product.id }, include: { images: true } });
    expect(unchanged.categoryId).toBe(product.categoryId);
    expect(unchanged.images).toHaveLength(1);
    expect(Number(unchanged.priceWholesale)).toBe(35000);
  });

  it("dos activaciones simultáneas dejan una sola campaña habilitada", async () => {
    const names = [prefix + " activación A", prefix + " activación B"];
    const results = await Promise.allSettled(names.map((name) => saveCampaignAction({ status: "idle" }, form({ name, isActive: "on" }))));
    const saved = await prisma.campaign.findMany({ where: { name: { in: names } } });
    campaignIds.push(...saved.map((campaign) => campaign.id));
    expect(results.every((result) => result.status === "rejected" && String(result.reason).includes("NEXT_REDIRECT"))).toBe(true);
    expect(saved).toHaveLength(2);
    expect(saved.filter((campaign) => campaign.isActive)).toHaveLength(1);
  });

  it("dos movimientos simultáneos no convierten las categorías en un ciclo", async () => {
    const a = await prisma.category.create({ data: { name: prefix + " A", slug: prefix + "-a" } });
    const b = await prisma.category.create({ data: { name: prefix + " B", slug: prefix + "-b" } });
    categoryIds.push(a.id, b.id);
    const results = await Promise.allSettled([
      saveCategoryAction({ status: "idle" }, form({ id: a.id, name: a.name, parentId: b.id })),
      saveCategoryAction({ status: "idle" }, form({ id: b.id, name: b.name, parentId: a.id })),
    ]);
    expect(results.filter((result) => result.status === "fulfilled" && result.value.status === "error")).toHaveLength(1);
    const savedA = await prisma.category.findUniqueOrThrow({ where: { id: a.id } });
    const savedB = await prisma.category.findUniqueOrThrow({ where: { id: b.id } });
    expect(savedA.parentId === b.id && savedB.parentId === a.id).toBe(false);
  });

  it("las categorías ocultas por su padre tampoco se destacan en una campaña", async () => {
    const parent = await prisma.category.create({ data: { name: prefix + " oculta", slug: prefix + "-oculta", isVisible: false } });
    categoryIds.push(parent.id);
    const child = await prisma.category.create({ data: { name: prefix + " hija", slug: prefix + "-hija", parentId: parent.id } });
    categoryIds.push(child.id);
    const campaign = await prisma.campaign.create({ data: { name: prefix + " visibilidad", slug: prefix + "-visibilidad", isActive: true, priorityCategories: { connect: { id: child.id } } } });
    campaignIds.push(campaign.id);
    expect((await getLiveCampaignBySlug(campaign.slug))?.priorityCategories).toEqual([]);
  });
});
