import Link from "next/link";
import { FaFacebookF, FaInstagram, FaTiktok } from "react-icons/fa6";

import { getSiteSettings } from "@/lib/site-config";
import { getColombiaDateKey } from "@/lib/seasonal-themes";
import { buildWhatsAppLink } from "@/lib/whatsapp";

export async function Footer() {
  const settings = await getSiteSettings();
  const whatsappHref = buildWhatsAppLink(settings.whatsappNumber, settings.whatsappDefaultMessage);
  // Año en hora de Colombia: el servidor puede estar en UTC y adelantarse en Nochevieja.
  const year = getColombiaDateKey().slice(0, 4);

  return (
    <footer className="seasonal-footer mt-16 border-t border-line bg-brand-accent/40">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-display text-lg font-semibold text-brand-primary">{settings.siteName}</p>
          <p className="mt-2 break-words text-sm text-ink-soft">{settings.footerText}</p>
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
                <a className="break-all hover:text-ink" href={`mailto:${settings.contactEmail}`}>
                  {settings.contactEmail}
                </a>
              </li>
            )}
            {settings.address && <li className="break-words">{settings.address}</li>}
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-ink">Síguenos</h2>
          <ul className="mt-3 space-y-2 text-sm text-ink-soft">
            {settings.instagramUrl && (
              <li>
                <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" className="focus-ring inline-flex items-center gap-2 hover:text-ink">
                  <FaInstagram className="h-4 w-4" aria-hidden="true" /> Instagram · @mpm_moda_mpm
                </a>
              </li>
            )}
            {settings.facebookUrl && (
              <li>
                <a href={settings.facebookUrl} target="_blank" rel="noopener noreferrer" className="focus-ring inline-flex items-center gap-2 hover:text-ink">
                  <FaFacebookF className="h-4 w-4" aria-hidden="true" /> Facebook · MPM Fabricante
                </a>
              </li>
            )}
            {settings.tiktokUrl && (
              <li>
                <a href={settings.tiktokUrl} target="_blank" rel="noopener noreferrer" className="focus-ring inline-flex items-center gap-2 hover:text-ink">
                  <FaTiktok className="h-4 w-4" aria-hidden="true" /> TikTok · @mpm_moda_mpm
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>
      <div className="border-t border-line px-4 py-4 text-center text-xs text-ink-soft">
        © {year} {settings.siteName}. Todos los derechos reservados.
      </div>
    </footer>
  );
}
