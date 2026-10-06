import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, MessageCircle, ShoppingBag } from "lucide-react";

import { getSiteSettings } from "@/lib/site-config";
import { getSiteUrl } from "@/lib/site-url";
import { getActiveCampaign } from "@/lib/campaigns";
import { getCategoryTree } from "@/lib/categories";
import { listProducts } from "@/lib/products";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { LinkButton } from "@/components/ui/button";
import { CategoryCard } from "@/components/catalog/category-card";
import { ProductShelf } from "@/components/catalog/product-shelf";
import { IMAGE_BLUR_DATA_URL } from "@/components/ui/image-placeholder";
import { JsonLd } from "@/components/seo/json-ld";

// La portada consulta datos actuales: imágenes, colecciones y campaña se
// actualizan desde el administrador sin esperar al siguiente despliegue.
export const dynamic = "force-dynamic";

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
  const heroImage = settings.heroImageUrl ?? latestProducts[0]?.images[0]?.url ?? null;
  const whatsappHref = buildWhatsAppLink(settings.whatsappNumber, settings.whatsappDefaultMessage);
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

      <section className="mx-auto max-w-[1440px] px-0 sm:px-6 sm:pt-6">
        <div className="seasonal-hero relative isolate min-h-[590px] overflow-hidden bg-[#242824] sm:min-h-[680px]">
          {heroImage && (
            <Image
              src={heroImage}
              alt=""
              fill
              priority
              sizes="(min-width: 1280px) 1440px, 100vw"
              placeholder="blur"
              blurDataURL={IMAGE_BLUR_DATA_URL}
              decoding="async"
              className="object-cover object-top"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/35 to-black/5" />
          <div className="relative z-10 flex min-h-[590px] max-w-xl flex-col justify-end px-6 py-10 text-white sm:min-h-[680px] sm:px-12 sm:py-14 lg:px-16">
            <p className="seasonal-highlight text-[10px] font-bold uppercase tracking-[0.18em] text-brand-secondary">Nueva colección · MPM</p>
            <h1 className="mt-4 font-display text-4xl font-semibold leading-[0.92] tracking-[-0.055em] sm:text-6xl lg:text-7xl">
              {settings.heroTitle}
            </h1>
            <p className="mt-5 max-w-md text-sm leading-6 text-white/85 sm:text-base">{settings.heroSubtitle}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <LinkButton href={settings.heroCtaHref} variant="secondary" size="lg">
                {settings.heroCtaLabel} <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </LinkButton>
              <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="focus-ring inline-flex items-center gap-2 border border-white/70 px-5 py-3 text-xs font-bold uppercase tracking-[0.1em] hover:bg-white hover:text-ink">
                <MessageCircle className="h-4 w-4" aria-hidden="true" /> Asesoría
              </a>
            </div>
          </div>
        </div>
      </section>

      {spotlightCategories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
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
        <section className="mx-auto max-w-7xl px-4 pb-5 sm:px-6 sm:pb-8">
          <Link href={`/campanas/${activeCampaign.slug}`} className="campaign-showcase focus-ring group grid overflow-hidden sm:grid-cols-[minmax(0,1fr)_minmax(260px,0.8fr)]">
            <div className="flex min-h-64 flex-col justify-end p-7 sm:p-10">
              <p className="campaign-kicker">Selección MPM</p>
              <h2 className="mt-3 font-display text-3xl font-semibold tracking-[-0.04em] text-white">{activeCampaign.name}</h2>
              {activeCampaign.description && <p className="mt-3 max-w-lg text-sm leading-6 text-white/80">{activeCampaign.description}</p>}
              <span className="mt-6 text-xs font-bold uppercase tracking-[0.1em] text-white group-hover:underline">Explorar selección →</span>
            </div>
            {activeCampaign.bannerImageUrl && <div className="campaign-visual relative min-h-64"><Image src={activeCampaign.bannerImageUrl} alt="" fill sizes="(min-width: 640px) 40vw, 100vw" placeholder="blur" blurDataURL={IMAGE_BLUR_DATA_URL} decoding="async" className="object-cover" /></div>}
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
