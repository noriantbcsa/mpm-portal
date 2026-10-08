"use server";

import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/dal";
import { categoryFormSchema } from "@/lib/validation/category";
import { uniqueSlug } from "@/lib/slug";
import { getCategorySubtreeIds } from "@/lib/categories";

export type CategoryFormState = { status: "idle" } | { status: "error"; message: string };

export async function saveCategoryAction(
  _prevState: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  await requireRole(["ADMIN"]);

  const id = String(formData.get("id") ?? "").trim() || null;
  const parentIdRaw = String(formData.get("parentId") ?? "").trim();

  const parsed = categoryFormSchema.safeParse({
    name: formData.get("name"),
    description: String(formData.get("description") ?? "").trim() || null,
    imageUrl: String(formData.get("imageUrl") ?? "").trim() || null,
    parentId: parentIdRaw || null,
    order: Number(formData.get("order") ?? 0) || 0,
    isVisible: formData.get("isVisible") === "on",
  });

  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { status: "error", message: first?.message ?? "Revisa los datos del formulario." };
  }

  const data = parsed.data;

  if (id && data.parentId) {
    const forbidden = await getCategorySubtreeIds(id);
    if (forbidden.includes(data.parentId)) {
      return { status: "error", message: "Una categoría no puede ser subcategoría de sí misma." };
    }
  }

  // La regla de niveles solo se aplica si el padre CAMBIA: una categoría que
  // ya estaba más profunda (de antes de la regla) debe poder seguir
  // renombrándose u ocultándose sin tener que desprenderla primero.
  const currentParentId = id
    ? ((await prisma.category.findUnique({ where: { id }, select: { parentId: true } }))?.parentId ?? null)
    : null;
  const parentChanged = !id || currentParentId !== (data.parentId ?? null);

  if (data.parentId && parentChanged) {
    // Solo dos niveles (categoría → subcategoría): las reglas de visibilidad
    // pública (PUBLIC_CATEGORY_WHERE) mira únicamente al padre
    // directo, así que una tercera capa bajo una categoría oculta
    // seguiría siendo pública.
    const parent = await prisma.category.findUnique({
      where: { id: data.parentId },
      select: { parentId: true },
    });
    if (!parent) return { status: "error", message: "La categoría padre ya no existe." };
    if (parent.parentId !== null) {
      return { status: "error", message: "Las categorías admiten solo dos niveles: elige una categoría principal como padre." };
    }
    if (id && (await prisma.category.count({ where: { parentId: id } })) > 0) {
      return { status: "error", message: "Esta categoría ya tiene subcategorías, así que no puede ser subcategoría de otra." };
    }
  }

  if (id) {
    await prisma.category.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        imageUrl: data.imageUrl || null,
        parentId: data.parentId,
        order: data.order,
        isVisible: data.isVisible,
      },
    });
    redirect("/admin/categorias?guardado=1");
  }

  const slug = await uniqueSlug(data.name, async (candidate) => {
    const existing = await prisma.category.findUnique({ where: { slug: candidate } });
    return Boolean(existing);
  });

  await prisma.category.create({
    data: {
      name: data.name,
      slug,
      description: data.description,
      imageUrl: data.imageUrl || null,
      parentId: data.parentId,
      order: data.order,
      isVisible: data.isVisible,
    },
  });
  redirect("/admin/categorias?creado=1");
}
