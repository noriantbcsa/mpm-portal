import type { Metadata } from "next";

import { getSiteSettings } from "@/lib/site-config";
import { buildWhatsAppLink } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Nosotros",
  description: "Conoce a MPM, fábrica de ropa con atención comercial personalizada.",
};

// El nombre del sitio y el número de WhatsApp se editan desde
// /admin/ajustes; sin esto la página quedaría congelada en el build.
export const dynamic = "force-dynamic";

export default async function NosotrosPage() {
  const settings = await getSiteSettings();
  const whatsappHref = buildWhatsAppLink(settings.whatsappNumber, settings.whatsappDefaultMessage);

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
        Sobre {settings.siteName}
      </h1>
      <div className="mt-4 flex flex-col gap-4 text-ink-soft">
        <p>
          {settings.siteName} es una fábrica de ropa. Este texto es un contenido provisional de
          ejemplo: el equipo de {settings.siteName} puede reemplazarlo en cualquier momento desde
          el panel administrativo, sin necesidad de tocar código.
        </p>
        <p>
          Trabajamos categoría por categoría —para dama, caballero, niños, dotación empresarial y
          accesorios— cuidando la calidad de cada referencia. No vendemos en línea con pasarela de
          pago: cada solicitud la revisa un asesor comercial, que te contacta para confirmar
          tallas, colores y condiciones antes de cerrar el pedido.
        </p>
        <p>
          ¿Tienes una pregunta puntual sobre una referencia, un pedido por volumen o una dotación
          empresarial? Escríbenos por WhatsApp y con gusto te asesoramos.
        </p>
      </div>
      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        className="focus-ring mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 py-3 text-base font-semibold text-white hover:brightness-95"
      >
        Escribir por WhatsApp
      </a>
    </div>
  );
}
