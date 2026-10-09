import type { Metadata } from "next";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";

import { getSiteSettings } from "@/lib/site-config";
import { getSiteUrl } from "@/lib/site-url";
import { displayCampaignName, getActiveCampaign } from "@/lib/campaigns";
import { getCategoryTree } from "@/lib/categories";
import { listProducts } from "@/lib/products";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { HeroCarousel, type HeroSlide } from "@/components/home/hero-carousel";
import { CategoryCard } from "@/components/catalog/category-card";
import { ProductShelf } from "@/components/catalog/product-shelf";
import { JsonLd } from "@/components/seo/json-ld";

// La portada consulta datos actuales: imágenes, colecciones y campaña se
// actualizan desde el administrador sin esperar al siguiente despliegue.
export const dynamic = "force-dynamic";

// La portada es la URL canónica de la raíz (título y descripción vienen del
// layout); sin esto `/?utm_source=…` y variantes se indexaban como páginas
// distintas.
export const metadata: Metadata = { alternates: { canonical: "/" } };

export default async function HomePage() {
  const [settings, activeCampaign, categories, latestResult] = await Promise.all([
    getSiteSettings(),
    getActiveCampaign(),
    getCategoryTree(),
    listProducts({ pageSize: 8, sort: "recientes" }),
  ]);

  const women = categories.find((category) => category.slug === "damas");
  const men = categories.find((category) => category.slug === "caballero");
  const [womenResult, menResult] = await Promise.all([
    women ? listProducts({ categorySlug: women.slug, pageSize: 4, sort: "recientes" }) : Promise.resolve({ items: [] }),
    men ? listProducts({ categorySlug: men.slug, pageSize: 4, sort: "recientes" }) : Promise.resolve({ items: [] }),
  ]);

  const latestProducts = latestResult.items;
  const photosOf = (items: typeof latestProducts, from = 0) =>
    items
      .filter((product) => product.images[0])
      .slice(from, from + 3)
      .map((product) => ({ url: product.images[0].url, alt: product.name, href: `/producto/${product.slug}` }));
  const whatsappHref = buildWhatsAppLink(settings.whatsappNumber, settings.whatsappDefaultMessage);
  const featured = photosOf(latestProducts);
  if (settings.heroImageUrl) featured.unshift({ url: settings.heroImageUrl, alt: settings.heroTitle, href: settings.heroCtaHref });

  const slides: HeroSlide[] = [
    { id: "portada", kicker: "Nueva colección · MPM", title: settings.heroTitle, text: settings.heroSubtitle, ctaLabel: settings.heroCtaLabel, ctaHref: settings.heroCtaHref, photos: featured },
    ...(womenResult.items.length > 0
      ? [{ id: "damas", kicker: "Damas", title: "Para ella", text: "Blusas, camisas y referencias de la colección femenina, en variedad de tallas y colores.", ctaLabel: "Ver damas", ctaHref: "/catalogo/damas", photos: photosOf(womenResult.items) }]
      : []),
    ...(menResult.items.length > 0
      ? [{ id: "caballero", kicker: "Caballero", title: "Para él", text: "Camisas y prendas de la colección masculina, hechas para el día a día.", ctaLabel: "Ver caballero", ctaHref: "/catalogo/caballero", photos: photosOf(menResult.items) }]
      : []),
    { id: "nosotros", kicker: "Nosotros · desde 2017", title: "Moda hecha con oficio y cercanía", text: `${settings.siteName} nació en Bogotá para construir una marca propia, creciendo con cada prenda y cada pedido.`, ctaLabel: "Conócenos", ctaHref: "/nosotros", photos: photosOf(latestProducts, 3).length >= 2 ? photosOf(latestProducts, 3) : featured },
  ].filter((slide) => slide.photos.length > 0);
  const siteUrl = getSiteUrl();
  const spotlightCategories = [women, men].filter((category): category is NonNullable<typeof category> => Boolean(category));
  return (
    <div>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: settings.siteName,
          url: siteUrl,
          potentialAction: {
            "@type": "SearchAction",
            target: `${siteUrl}/catalogo?q={search_term_string}`,
            "query-input": "required name=search_term_string",
          },
        }}
      />

      <section className="border-b border-line bg-ink px-4 py-2 text-center text-[10px] font-bold uppercase tracking-[0.14em] text-white sm:px-6">
        MPM · prendas para todos los días · atención personalizada por WhatsApp
      </section>

      <HeroCarousel slides={slides} />

      {spotlightCategories.length > 0 && (
        <section className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6 sm:py-16">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div className="seasonal-section-heading">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-ink-soft">Comprar por colección</p>
              <h2 className="mt-2 font-display text-3xl font-semibold tracking-[-0.04em] text-ink sm:text-4xl">Encuentra tu estilo</h2>
            </div>
            <Link href="/catalogo" className="focus-ring mb-1 text-xs font-bold uppercase tracking-[0.1em] text-ink hover:underline">Ver catálogo →</Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
            {spotlightCategories.map((category) => (
              <CategoryCard
                key={category.id}
                name={category.name}
                slug={category.slug}
                imageUrl={category.imageUrl ?? (category.slug === "damas" ? womenResult.items[0]?.images[0]?.url ?? null : menResult.items[0]?.images[0]?.url ?? null)}
              />
            ))}
          </div>
        </section>
      )}

      {activeCampaign && (
        <section className="mx-auto max-w-[1440px] px-4 pb-8 sm:px-6 sm:pb-12">
          <Link
            href={`/campanas/${activeCampaign.slug}`}
            className="campaign-showcase focus-ring group block overflow-hidden"
          >
            <div className="mx-auto flex min-h-[16rem] max-w-4xl flex-col items-center justify-center gap-4 px-6 py-14 text-center sm:px-14 sm:py-20">
              <p className="campaign-kicker">Campaña</p>
              <h2 className="font-display text-3xl font-semibold uppercase leading-tight tracking-[0.06em] sm:text-5xl">{displayCampaignName(activeCampaign.name)}</h2>
              {activeCampaign.description && <p className="max-w-xl text-base leading-7 text-ink-soft">{activeCampaign.description}</p>}
              <span className="mt-2 w-fit border-b border-current pb-1 text-sm font-semibold uppercase tracking-[0.14em] group-hover:opacity-70">Ver colección</span>
            </div>
          </Link>
        </section>
      )}

      <ProductShelf title="Lo nuevo" description="Referencias recién incorporadas al catálogo MPM." seeAllHref="/catalogo" products={latestProducts} showPrices={settings.showPrices} />

      {womenResult.items.length > 0 && <ProductShelf title="Damas" description="Una selección de la colección para ella." seeAllHref="/catalogo/damas" products={womenResult.items} showPrices={settings.showPrices} />}
      {menResult.items.length > 0 && <ProductShelf title="Caballero" description="Una selección de la colección para él." seeAllHref="/catalogo/caballero" products={menResult.items} showPrices={settings.showPrices} />}

      <section className="mx-auto max-w-7xl px-4 pb-14 pt-8 sm:px-6 sm:pb-20">
        <div className="seasonal-soft-surface grid border border-line bg-[#f7f7f5] sm:grid-cols-[1fr_auto] sm:items-center">
          <div className="p-7 sm:p-10">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-ink-soft">Compra acompañada</p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-[-0.04em] text-ink">¿Quieres ayuda para elegir?</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-ink-soft">Guarda tus prendas en el carrito o habla con el equipo MPM para confirmar colores, tallas y disponibilidad.</p>
          </div>
          <div className="px-7 pb-7 sm:px-10 sm:pb-0">
            <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="focus-ring inline-flex items-center gap-2 bg-ink px-5 py-3 text-xs font-bold uppercase tracking-[0.1em] text-white hover:bg-brand-primary-dark">
              <ShoppingBag className="h-4 w-4" aria-hidden="true" /> Hablar con MPM
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
