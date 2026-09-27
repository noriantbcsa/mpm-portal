import type { Metadata } from "next";

import { getSiteSettings } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Política de tratamiento de datos personales",
  description: "Cómo MPM recolecta, usa y protege los datos personales de sus clientes.",
};

// El texto se edita desde /admin/ajustes; sin esto quedaría congelado en el
// HTML del build hasta el próximo despliegue.
export const dynamic = "force-dynamic";

const FALLBACK_POLICY = `
Este es un texto provisional de política de tratamiento de datos personales, pendiente de
revisión y aprobación por parte de MPM y, si aplica, de su asesor legal, antes de salir a
producción.

1. Responsable del tratamiento: MPM (fábrica de ropa), en el marco de la Ley 1581 de 2012 y
sus decretos reglamentarios sobre protección de datos personales en Colombia.

2. Datos que recolectamos: nombre, número de teléfono o WhatsApp, ciudad y modalidad de compra (si aplica)
y el detalle de los productos que seleccionas en el carrito de pedidos.

3. Finalidad: usamos estos datos exclusivamente para que un asesor comercial de MPM te
contacte, confirme disponibilidad y cierre tu pedido. No usamos ni compartimos tus datos con
fines distintos ni los vendemos a terceros.

4. Conservación: conservamos tus datos mientras exista una relación comercial vigente o
mientras la ley lo exija.

5. Tus derechos: puedes conocer, actualizar, rectificar o solicitar la eliminación de tus
datos personales escribiéndonos por WhatsApp o al correo de contacto que aparece en el pie de
página.

Al marcar la casilla de aceptación en el carrito de pedidos, autorizas a MPM a contactarte por
WhatsApp o llamada para gestionar tu solicitud.
`.trim();

export default async function PoliticaDeDatosPage() {
  const settings = await getSiteSettings();
  const text = settings.dataPolicyText?.trim() || FALLBACK_POLICY;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
        Política de tratamiento de datos personales
      </h1>
      <div className="mt-6 whitespace-pre-line text-sm leading-relaxed text-ink-soft">{text}</div>
    </div>
  );
}
