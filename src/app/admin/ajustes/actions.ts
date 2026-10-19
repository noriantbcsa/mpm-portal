"use server";

import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/dal";
import { siteSettingsFormSchema } from "@/lib/validation/site-settings";

const SETTINGS_TEXT_FIELDS = [
  "siteName", "tagline", "logoUrl", "primaryColor", "secondaryColor", "accentColor",
  "whatsappNumber", "whatsappDefaultMessage", "contactEmail", "contactPhone",
  "address", "instagramUrl", "facebookUrl", "tiktokUrl", "heroTitle", "heroSubtitle",
  "heroImageUrl", "heroCtaLabel", "heroCtaHref", "footerText", "dataPolicyText",
] as const;

export type SubmittedSettingsValues = {
  text: Record<(typeof SETTINGS_TEXT_FIELDS)[number], string>;
  showPrices: boolean;
};

export type SettingsFormState =
  | { status: "idle" }
  | { status: "error"; message: string; values: SubmittedSettingsValues };

function submittedValues(formData: FormData): SubmittedSettingsValues {
  const text = Object.fromEntries(
    SETTINGS_TEXT_FIELDS.map((field) => [field, String(formData.get(field) ?? "")]),
  ) as SubmittedSettingsValues["text"];
  return { text, showPrices: formData.get("showPrices") === "on" };
}

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
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Revisa los datos.",
      values: submittedValues(formData),
    };
  }

  await prisma.siteSettings.upsert({
    where: { id: "default" },
    create: { id: "default", ...parsed.data },
    update: parsed.data,
  });

  redirect("/admin/ajustes?guardado=1");
}
