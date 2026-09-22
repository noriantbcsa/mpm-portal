"use server";

import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/dal";
import { siteSettingsFormSchema } from "@/lib/validation/site-settings";

export type SettingsFormState = { status: "idle" } | { status: "error"; message: string };

function emptyToNull(value: FormDataEntryValue | null) {
  const str = String(value ?? "").trim();
  return str || null;
}

export async function saveSiteSettingsAction(
  _prevState: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  await requireRole(["ADMIN"]);

  const parsed = siteSettingsFormSchema.safeParse({
    siteName: formData.get("siteName"),
    tagline: formData.get("tagline"),
    logoUrl: emptyToNull(formData.get("logoUrl")),
    primaryColor: formData.get("primaryColor"),
    secondaryColor: formData.get("secondaryColor"),
    accentColor: formData.get("accentColor"),
    whatsappNumber: formData.get("whatsappNumber"),
    whatsappDefaultMessage: formData.get("whatsappDefaultMessage"),
    contactEmail: emptyToNull(formData.get("contactEmail")),
    contactPhone: emptyToNull(formData.get("contactPhone")),
    address: emptyToNull(formData.get("address")),
    instagramUrl: emptyToNull(formData.get("instagramUrl")),
    facebookUrl: emptyToNull(formData.get("facebookUrl")),
    tiktokUrl: emptyToNull(formData.get("tiktokUrl")),
    heroTitle: formData.get("heroTitle"),
    heroSubtitle: formData.get("heroSubtitle"),
    heroImageUrl: emptyToNull(formData.get("heroImageUrl")),
    heroCtaLabel: formData.get("heroCtaLabel"),
    heroCtaHref: formData.get("heroCtaHref"),
    footerText: formData.get("footerText"),
    dataPolicyText: emptyToNull(formData.get("dataPolicyText")),
    showPrices: formData.get("showPrices") === "on",
  });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Revisa los datos." };
  }

  await prisma.siteSettings.upsert({
    where: { id: "default" },
    create: { id: "default", ...parsed.data },
    update: parsed.data,
  });

  redirect("/admin/ajustes?guardado=1");
}
