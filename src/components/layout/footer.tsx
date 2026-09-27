import Link from "next/link";
import { Camera, Music2, UsersRound } from "lucide-react";

import { getSiteSettings } from "@/lib/site-config";
import { buildWhatsAppLink } from "@/lib/whatsapp";

export async function Footer() {
  const settings = await getSiteSettings();
  const whatsappHref = buildWhatsAppLink(settings.whatsappNumber, settings.whatsappDefaultMessage);
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-line bg-brand-accent/40">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-display text-lg font-semibold text-brand-primary">{settings.siteName}</p>
          <p className="mt-2 text-sm text-ink-soft">{settings.footerText}</p>
        </div>

        <nav aria-label="Enlaces del portal">
          <h2 className="text-sm font-semibold text-ink">Portal</h2>
          <ul className="mt-3 space-y-2 text-sm text-ink-soft">
            <li><Link className="hover:text-ink" href="/catalogo">Catálogo</Link></li>
            <li><Link className="hover:text-ink" href="/carrito">Carrito de pedidos</Link></li>
            <li><Link className="hover:text-ink" href="/nosotros">Nosotros</Link></li>
            <li><Link className="hover:text-ink" href="/politica-de-datos">Política de tratamiento de datos</Link></li>
            <li><Link className="hover:text-ink" href="/login">Acceso equipo MPM</Link></li>
          </ul>
        </nav>

        <div>
          <h2 className="text-sm font-semibold text-ink">Contacto</h2>
          <ul className="mt-3 space-y-2 text-sm text-ink-soft">
            <li>
              <a className="hover:text-ink" href={whatsappHref} target="_blank" rel="noopener noreferrer">
                WhatsApp comercial
              </a>
            </li>
            {settings.contactEmail && (
              <li>
                <a className="hover:text-ink" href={`mailto:${settings.contactEmail}`}>
                  {settings.contactEmail}
                </a>
              </li>
            )}
            {settings.contactPhone && <li>{settings.contactPhone}</li>}
            {settings.address && <li>{settings.address}</li>}
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-ink">Síguenos</h2>
          <div className="mt-3 flex gap-3">
            {settings.instagramUrl && (
              <a
                href={settings.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram de MPM"
                className="focus-ring rounded-full border border-line p-2 hover:bg-paper"
              >
                <Camera className="h-4 w-4" aria-hidden="true" />
              </a>
            )}
            {settings.facebookUrl && (
              <a
                href={settings.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook de MPM"
                className="focus-ring rounded-full border border-line p-2 hover:bg-paper"
              >
                <UsersRound className="h-4 w-4" aria-hidden="true" />
              </a>
            )}
            {settings.tiktokUrl && (
              <a
                href={settings.tiktokUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok de MPM"
                className="focus-ring rounded-full border border-line p-2 hover:bg-paper"
              >
                <Music2 className="h-4 w-4" aria-hidden="true" />
              </a>
            )}
          </div>
        </div>
      </div>
      <div className="border-t border-line px-4 py-4 text-center text-xs text-ink-soft">
        © {year} {settings.siteName}. Todos los derechos reservados.
      </div>
    </footer>
  );
}
