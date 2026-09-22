"use client";

import { useActionState } from "react";

import { saveSiteSettingsAction, type SettingsFormState } from "@/app/admin/ajustes/actions";
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

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <AdminCard>
        <AdminCardBody className="grid gap-4 sm:grid-cols-2">
          <h2 className="text-sm font-semibold text-slate-900 sm:col-span-2">Identidad</h2>
          <AdminTextField label="Nombre del sitio" name="siteName" defaultValue={settings.siteName} required />
          <AdminTextField label="Eslogan" name="tagline" defaultValue={settings.tagline} required />
          <AdminTextField
            label="Logo (URL, opcional)"
            name="logoUrl"
            defaultValue={settings.logoUrl ?? ""}
            className="sm:col-span-2"
          />
          <AdminTextField label="Color principal" name="primaryColor" defaultValue={settings.primaryColor} required />
          <AdminTextField label="Color secundario" name="secondaryColor" defaultValue={settings.secondaryColor} required />
          <AdminTextField label="Color de fondo/acento" name="accentColor" defaultValue={settings.accentColor} required />
        </AdminCardBody>
      </AdminCard>

      <AdminCard>
        <AdminCardBody className="grid gap-4 sm:grid-cols-2">
          <h2 className="text-sm font-semibold text-slate-900 sm:col-span-2">Contacto y WhatsApp</h2>
          <AdminTextField
            label="Número de WhatsApp"
            name="whatsappNumber"
            defaultValue={settings.whatsappNumber}
            required
            hint="Solo dígitos, con indicativo de país. Ej: 573001234567"
          />
          <AdminTextField label="Correo de contacto" name="contactEmail" defaultValue={settings.contactEmail ?? ""} />
          <AdminTextAreaField
            label="Mensaje por defecto de WhatsApp"
            name="whatsappDefaultMessage"
            defaultValue={settings.whatsappDefaultMessage}
            required
            className="sm:col-span-2"
          />
          <AdminTextField label="Teléfono de contacto" name="contactPhone" defaultValue={settings.contactPhone ?? ""} />
          <AdminTextField label="Dirección" name="address" defaultValue={settings.address ?? ""} />
          <AdminTextField label="Instagram (URL)" name="instagramUrl" defaultValue={settings.instagramUrl ?? ""} />
          <AdminTextField label="Facebook (URL)" name="facebookUrl" defaultValue={settings.facebookUrl ?? ""} />
          <AdminTextField label="TikTok (URL)" name="tiktokUrl" defaultValue={settings.tiktokUrl ?? ""} />
        </AdminCardBody>
      </AdminCard>

      <AdminCard>
        <AdminCardBody className="grid gap-4 sm:grid-cols-2">
          <h2 className="text-sm font-semibold text-slate-900 sm:col-span-2">Inicio</h2>
          <AdminTextField label="Título del banner" name="heroTitle" defaultValue={settings.heroTitle} required className="sm:col-span-2" />
          <AdminTextAreaField
            label="Subtítulo del banner"
            name="heroSubtitle"
            defaultValue={settings.heroSubtitle}
            className="sm:col-span-2"
          />
          <AdminTextField label="Imagen del banner (URL)" name="heroImageUrl" defaultValue={settings.heroImageUrl ?? ""} className="sm:col-span-2" />
          <AdminTextField label="Texto del botón" name="heroCtaLabel" defaultValue={settings.heroCtaLabel} required />
          <AdminTextField label="Enlace del botón" name="heroCtaHref" defaultValue={settings.heroCtaHref} required />
        </AdminCardBody>
      </AdminCard>

      <AdminCard>
        <AdminCardBody className="grid gap-4">
          <h2 className="text-sm font-semibold text-slate-900">Pie de página y legales</h2>
          <AdminTextField label="Texto del pie de página" name="footerText" defaultValue={settings.footerText} required />
          <AdminTextAreaField
            label="Política de tratamiento de datos"
            name="dataPolicyText"
            defaultValue={settings.dataPolicyText ?? ""}
            hint="Este texto se muestra en /politica-de-datos. Debe ser revisado por MPM antes de producción."
          />
          <AdminCheckbox
            label="Mostrar precios de referencia en el catálogo público"
            name="showPrices"
            defaultChecked={settings.showPrices}
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
