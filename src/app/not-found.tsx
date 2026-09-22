import Link from "next/link";

import { getSiteSettings } from "@/lib/site-config";
import { buildWhatsAppLink } from "@/lib/whatsapp";

export default async function NotFound() {
  const settings = await getSiteSettings();
  const whatsappHref = buildWhatsAppLink(settings.whatsappNumber, settings.whatsappDefaultMessage);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-paper px-4 text-center text-ink">
      <p className="text-sm font-medium uppercase tracking-wide text-brand-primary">
        Error 404
      </p>
      <h1 className="font-display text-2xl font-semibold sm:text-3xl">
        No encontramos esta página
      </h1>
      <p className="max-w-md text-ink-soft">
        Puede que el enlace esté vencido o mal escrito. Vuelve al catálogo o escríbenos por
        WhatsApp si buscabas algo en particular.
      </p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/catalogo"
          className="focus-ring inline-flex items-center justify-center rounded-full bg-brand-primary px-6 py-3 text-sm font-medium text-white hover:bg-brand-primary-dark"
        >
          Ver catálogo
        </Link>
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="focus-ring inline-flex items-center justify-center rounded-full bg-[#25D366] px-6 py-3 text-sm font-medium text-[#0b3d24] hover:brightness-95"
        >
          Escribir por WhatsApp
        </a>
      </div>
    </div>
  );
}
