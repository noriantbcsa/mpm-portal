import Link from "next/link";
import Image from "next/image";
import { Search } from "lucide-react";

import { getSiteSettings } from "@/lib/site-config";
import { getActiveCampaign } from "@/lib/campaigns";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { CartIndicator } from "@/components/layout/cart-indicator";
import { MobileNav, type NavLink } from "@/components/layout/mobile-nav";

export async function Header() {
  const [settings, activeCampaign] = await Promise.all([
    getSiteSettings(),
    getActiveCampaign(),
  ]);

  const navLinks: NavLink[] = [
    { href: "/catalogo", label: "Catálogo" },
    ...(activeCampaign ? [{ href: `/campanas/${activeCampaign.slug}`, label: activeCampaign.name }] : []),
    { href: "/nosotros", label: "Nosotros" },
  ];

  const whatsappHref = buildWhatsAppLink(settings.whatsappNumber, settings.whatsappDefaultMessage);

  return (
    <header className="public-header relative z-30 border-b border-line bg-paper">
      {activeCampaign && (
        <div className="bg-brand-primary px-4 py-2 text-center text-xs font-medium text-white sm:text-sm">
          <span className="font-bold">Campaña activa ·</span> {activeCampaign.name}: {activeCampaign.description ?? "conoce la selección"}{" "}
          <Link href={`/campanas/${activeCampaign.slug}`} className="underline underline-offset-2">
            ver más
          </Link>
        </div>
      )}
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:gap-6">
        <Link href="/" className="focus-ring flex items-center gap-2 shrink-0">
          {settings.logoUrl ? (
            <Image
              src={settings.logoUrl}
              alt={settings.siteName}
              width={40}
              height={40}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <span
              aria-hidden="true"
              className="flex h-10 w-10 items-center justify-center bg-brand-primary text-lg font-bold tracking-[-0.08em] text-white"
            >
              {settings.siteName.slice(0, 1)}
            </span>
          )}
          <span className="text-xl font-black tracking-[-0.06em] text-brand-primary">
            {settings.siteName}
          </span>
        </Link>

        <nav aria-label="Principal" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="focus-ring block px-3 py-2 text-xs font-bold uppercase tracking-[0.1em] text-ink hover:bg-brand-accent"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <form
          action="/catalogo"
          method="GET"
          className="hidden flex-1 items-center md:flex"
          role="search"
        >
          <label htmlFor="desktop-search" className="sr-only">
            Buscar productos
          </label>
          <div className="relative w-full max-w-sm">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft"
            />
            <input
              id="desktop-search"
              name="q"
              type="search"
              placeholder="Buscar por nombre o referencia…"
              className="focus-ring w-full border border-line py-2 pl-9 pr-4 text-sm"
            />
          </div>
        </form>

        <div className="ml-auto flex items-center gap-2">
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="focus-ring hidden items-center gap-2 bg-[#25D366] px-3 py-2 text-xs font-bold uppercase tracking-[0.08em] text-[#0b3d24] hover:brightness-95 sm:inline-flex"
          >
            WhatsApp
          </a>
          <CartIndicator />
          <MobileNav links={navLinks} />
        </div>
      </div>
    </header>
  );
}
