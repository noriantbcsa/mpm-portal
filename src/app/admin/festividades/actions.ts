"use server";

import { redirect } from "next/navigation";

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

  await prisma.siteSettings.upsert({
    where: { id: "default" },
    create: { id: "default", ...parsed.data },
    update: parsed.data,
  });

  redirect("/admin/festividades?guardado=1");
}
