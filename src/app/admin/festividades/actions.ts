"use server";

import { redirect } from "next/navigation";
import type { SeasonalThemePreset } from "@prisma/client";

import { requireRole } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { seasonalThemeFormSchema } from "@/lib/validation/seasonal-theme";

export type SeasonalThemeFormState =
  | { status: "idle" }
  | { status: "error"; message: string };

export async function saveSeasonalThemeAction(
  _prevState: SeasonalThemeFormState,
  formData: FormData,
): Promise<SeasonalThemeFormState> {
  await requireRole(["ADMIN"]);

  const parsed = seasonalThemeFormSchema.safeParse({
    seasonalThemeMode: formData.get("seasonalThemeMode"),
    seasonalThemePreset: formData.get("seasonalThemePreset"),
  });

  if (!parsed.success) {
    return { status: "error", message: "Selecciona un modo y un diseño válidos." };
  }

  // `prisma generate` (ejecutado en Node 22 durante el build) actualiza este
  // enum a la par con la migración. El cast conserva la compatibilidad del
  // árbol local cuando aún conserva el cliente generado anterior.
  const data = {
    ...parsed.data,
    seasonalThemePreset: parsed.data.seasonalThemePreset as SeasonalThemePreset,
  };

  await prisma.siteSettings.upsert({
    where: { id: "default" },
    create: { id: "default", ...data },
    update: data,
  });

  redirect("/admin/festividades?guardado=1");
}
