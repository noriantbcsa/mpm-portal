import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireRole } from "@/lib/auth/dal";
import { getAllCategoriesFlat, buildCategoryOptions } from "@/lib/categories";
import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/components/admin/product-form";

export const metadata: Metadata = { title: "Editar producto", robots: { index: false } };

type PageProps = { params: Promise<{ id: string }>; searchParams: Promise<{ creado?: string; guardado?: string }> };

export default async function EditarProductoPage({ params, searchParams }: PageProps) {
  await requireRole(["ADMIN"]);
  const { id } = await params;
  const sp = await searchParams;

  const [product, categories, campaigns] = await Promise.all([
    prisma.product.findUnique({ where: { id }, include: { images: { orderBy: { order: "asc" } } } }),
    getAllCategoriesFlat({ includeHidden: true }),
    prisma.campaign.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!product) notFound();

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-semibold text-slate-900">Editar producto</h1>
      <p className="mt-1 text-sm text-slate-500">{product.name}</p>
      {(sp.creado || sp.guardado) && (
        <p className="mt-3 rounded-md bg-green-50 px-3 py-2 text-sm font-medium text-green-700">
          {sp.creado ? "Producto creado correctamente." : "Cambios guardados."}
        </p>
      )}
      <div className="mt-6">
        <ProductForm
          categoryOptions={buildCategoryOptions(categories)}
          campaigns={campaigns.map((c) => ({ id: c.id, name: c.name }))}
          initial={{
            id: product.id,
            sku: product.sku,
            name: product.name,
            description: product.description,
            categoryId: product.categoryId,
            audience: product.audience,
            sizes: product.sizes,
            colors: product.colors,
            material: product.material,
            status: product.status,
            tags: product.tags,
            campaignId: product.campaignId,
            priceRef: product.priceRef ? Number(product.priceRef) : null,
            images: product.images.map((i) => ({ url: i.url, alt: i.alt, color: i.color, order: i.order })),
          }}
        />
      </div>
    </div>
  );
}
