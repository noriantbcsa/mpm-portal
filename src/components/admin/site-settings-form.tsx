"use client";

import { useActionState } from "react";

import { saveSiteSettingsAction, type SettingsFormState, type SubmittedSettingsValues } from "@/app/admin/ajustes/actions";
import type { SiteSettingsData } from "@/lib/site-config";
import {
  AdminButton,
  AdminCheckbox,
  AdminTextAreaField,
  AdminTextField,
} from "@/components/admin/ui/controls";
import { AdminCard, AdminCardBody } from "@/components/admin/ui/display";

const initialState: SettingsFormState = { status: "idle" };

export function SiteSettingsForm({ settings }: { settings: SiteSettingsData }) {
  const [state, formAction, pending] = useActionState(saveSiteSettingsAction, initialState);
  const submitted = state.status === "error" ? state.values : undefined;
  const value = (field: keyof SubmittedSettingsValues["text"], saved: string) =>
    submitted?.text[field] ?? saved;

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <AdminCard>
        <AdminCardBody className="grid gap-4 sm:grid-cols-2">
          <h2 className="text-sm font-semibold text-slate-900 sm:col-span-2">Identidad</h2>
          <AdminTextField label="Nombre del sitio" name="siteName" defaultValue={value("siteName", settings.siteName)} required />
          <AdminTextField label="Eslogan" name="tagline" defaultValue={value("tagline", settings.tagline)} required />
          <AdminTextField
            label="Logo (URL, opcional)"
            name="logoUrl"
            defaultValue={value("logoUrl", settings.logoUrl ?? "")}
            className="sm:col-span-2"
          />
          <AdminTextField label="Color principal" name="primaryColor" defaultValue={value("primaryColor", settings.primaryColor)} required />
          <AdminTextField label="Color secundario" name="secondaryColor" defaultValue={value("secondaryColor", settings.secondaryColor)} required />
          <AdminTextField label="Color de fondo/acento" name="accentColor" defaultValue={value("accentColor", settings.accentColor)} required />
        </AdminCardBody>
      </AdminCard>

      <AdminCard>
        <AdminCardBody className="grid gap-4 sm:grid-cols-2">
          <h2 className="text-sm font-semibold text-slate-900 sm:col-span-2">Contacto y WhatsApp</h2>
          <AdminTextField
            label="Número de WhatsApp"
            name="whatsappNumber"
            defaultValue={value("whatsappNumber", settings.whatsappNumber)}
            required
            hint="Solo dígitos, con indicativo de país. Ej: 573001234567"
          />
          <AdminTextField label="Correo de contacto" name="contactEmail" defaultValue={value("contactEmail", settings.contactEmail ?? "")} />
          <AdminTextAreaField
            label="Mensaje por defecto de WhatsApp"
            name="whatsappDefaultMessage"
            defaultValue={value("whatsappDefaultMessage", settings.whatsappDefaultMessage)}
            required
            className="sm:col-span-2"
          />
          <AdminTextField label="Teléfono de contacto" name="contactPhone" defaultValue={value("contactPhone", settings.contactPhone ?? "")} />
          <AdminTextField label="Dirección" name="address" defaultValue={value("address", settings.address ?? "")} />
          <AdminTextField label="Instagram (URL)" name="instagramUrl" defaultValue={value("instagramUrl", settings.instagramUrl ?? "")} />
          <AdminTextField label="Facebook (URL)" name="facebookUrl" defaultValue={value("facebookUrl", settings.facebookUrl ?? "")} />
          <AdminTextField label="TikTok (URL)" name="tiktokUrl" defaultValue={value("tiktokUrl", settings.tiktokUrl ?? "")} />
        </AdminCardBody>
      </AdminCard>

      <AdminCard>
        <AdminCardBody className="grid gap-4 sm:grid-cols-2">
          <h2 className="text-sm font-semibold text-slate-900 sm:col-span-2">Inicio</h2>
          <AdminTextField label="Título del banner" name="heroTitle" defaultValue={value("heroTitle", settings.heroTitle)} required className="sm:col-span-2" />
          <AdminTextAreaField
            label="Subtítulo del banner"
            name="heroSubtitle"
            defaultValue={value("heroSubtitle", settings.heroSubtitle)}
            className="sm:col-span-2"
          />
          <AdminTextField label="Imagen del banner (URL)" name="heroImageUrl" defaultValue={value("heroImageUrl", settings.heroImageUrl ?? "")} className="sm:col-span-2" />
          <AdminTextField label="Texto del botón" name="heroCtaLabel" defaultValue={value("heroCtaLabel", settings.heroCtaLabel)} required />
          <AdminTextField label="Enlace del botón" name="heroCtaHref" defaultValue={value("heroCtaHref", settings.heroCtaHref)} required />
        </AdminCardBody>
      </AdminCard>

      <AdminCard>
        <AdminCardBody className="grid gap-4">
          <h2 className="text-sm font-semibold text-slate-900">Pie de página y legales</h2>
          <AdminTextField label="Texto del pie de página" name="footerText" defaultValue={value("footerText", settings.footerText)} required />
          <AdminTextAreaField
            label="Política de tratamiento de datos"
            name="dataPolicyText"
            defaultValue={value("dataPolicyText", settings.dataPolicyText ?? "")}
            hint="Opcional. Déjalo vacío para mostrar la política por defecto (Ley 1581 de 2012) o escribe aquí tu texto completo para reemplazarla. Debe revisarlo tu asesor legal."
          />
          <AdminCheckbox
            label="Mostrar precios de referencia en el catálogo público"
            name="showPrices"
            defaultChecked={submitted?.showPrices ?? settings.showPrices}
          />
        </AdminCardBody>
      </AdminCard>

      {state.status === "error" && (
        <p role="alert" className="text-sm font-medium text-red-600">
          {state.message}
        </p>
      )}

      <div className="flex justify-end">
        <AdminButton type="submit" disabled={pending}>
          {pending ? "Guardando…" : "Guardar ajustes"}
        </AdminButton>
      </div>
    </form>
  );
}
