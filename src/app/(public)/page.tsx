import Image from "next/image";
import Link from "next/link";
import { PackageCheck, MessageCircleHeart, Ruler, Truck } from "lucide-react";

import { getSiteSettings } from "@/lib/site-config";
import { getActiveCampaign } from "@/lib/campaigns";
import { getCategoryTree } from "@/lib/categories";
import { getFeaturedProducts } from "@/lib/products";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { LinkButton } from "@/components/ui/button";
import { CategoryCard } from "@/components/catalog/category-card";
import { ProductShelf } from "@/components/catalog/product-shelf";
import { JsonLd } from "@/components/seo/json-ld";

// Sin esto, Next congela esta página como HTML estático en el build (no usa
// ninguna API de request): la campaña activa, el banner o los destacados
// tardarían en reflejar cambios de /admin hasta el próximo despliegue.
export const dynamic = "force-dynamic";

const benefits = [
  {
    icon: Ruler,
    title: "Guía de tallas clara",
    description: "Encuentra la talla correcta para cada prenda antes de pedir.",
  },
  {
    icon: PackageCheck,
    title: "Catálogo amplio",
    description: "Más de 300 referencias organizadas por categoría y ocasión.",
  },
  {
    icon: MessageCircleHeart,
    title: "Atención personalizada",
    description: "Un asesor humano confirma disponibilidad y cierra tu pedido.",
  },
  {
    icon: Truck,
    title: "Pedidos por WhatsApp",
    description: "Sin pagos en línea: coordinamos todo directamente contigo.",
  },
];

export default async function HomePage() {
  const [settings, activeCampaign, categories, recomendados, ofertas, tendencias] = await Promise.all([
    getSiteSettings(),
    getActiveCampaign(),
    getCategoryTree(),
    getFeaturedProducts("RECOMENDADO", 8),
    getFeaturedProducts("OFERTA", 8),
    getFeaturedProducts("TENDENCIA", 8),
  ]);

  const whatsappHref = buildWhatsAppLink(settings.whatsappNumber, settings.whatsappDefaultMessage);
  const topCategories = categories.slice(0, 6);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

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

      <section className="relative overflow-hidden bg-brand-primary">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-14 sm:py-20 lg:grid-cols-2">
          <div className="relative z-10">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-secondary">
              {settings.siteName}
            </p>
            <h1 className="mt-2 font-display text-3xl font-black uppercase tracking-[-0.06em] text-white sm:text-5xl">
              {settings.heroTitle}
            </h1>
            <p className="mt-4 max-w-md text-base text-white/85">{settings.heroSubtitle}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <LinkButton href={settings.heroCtaHref} variant="secondary" size="lg">
                {settings.heroCtaLabel}
              </LinkButton>
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="focus-ring inline-flex items-center justify-center gap-2 border border-white/40 px-6 py-3 text-xs font-bold uppercase tracking-[0.1em] text-white hover:bg-white/10"
              >
                Hablar con un asesor
              </a>
            </div>
          </div>
          {settings.heroImageUrl && (
            <div className="relative aspect-[4/3] w-full overflow-hidden border border-white/20 lg:aspect-square">
              <Image
                src={settings.heroImageUrl}
                alt=""
                fill
                priority
                sizes="(min-width: 1024px) 40vw, 90vw"
                className="object-cover"
              />
            </div>
          )}
        </div>
      </section>

      {activeCampaign && (
        <section className="mx-auto max-w-6xl px-4 py-10">
          <Link
            href={`/campanas/${activeCampaign.slug}`}
            className="focus-ring group flex flex-col items-center gap-6 overflow-hidden border border-line bg-brand-accent/60 p-6 sm:flex-row sm:p-8"
          >
            {activeCampaign.bannerImageUrl && (
              <div className="relative h-40 w-full shrink-0 overflow-hidden sm:h-32 sm:w-48">
                <Image src={activeCampaign.bannerImageUrl} alt="" fill sizes="192px" className="object-cover" />
              </div>
            )}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-primary">
                Campaña activa
              </p>
              <h2 className="mt-1 font-display text-xl font-semibold text-ink sm:text-2xl">
                {activeCampaign.name}
              </h2>
              {activeCampaign.description && (
                <p className="mt-1 max-w-xl text-sm text-ink-soft">{activeCampaign.description}</p>
              )}
              <span className="mt-3 inline-block text-sm font-medium text-brand-primary group-hover:underline">
                Ver colección de la campaña →
              </span>
            </div>
          </Link>
        </section>
      )}

      {topCategories.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-10">
          <h2 className="mb-4 font-display text-xl font-semibold text-ink sm:text-2xl">
            Compra por categoría
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {topCategories.map((category) => (
              <CategoryCard
                key={category.id}
                name={category.name}
                slug={category.slug}
                imageUrl={category.imageUrl}
              />
            ))}
          </div>
        </section>
      )}

      <ProductShelf
        title="Recomendados"
        description="Selección del equipo MPM."
        seeAllHref="/catalogo?etiqueta=RECOMENDADO"
        products={recomendados}
        showPrices={settings.showPrices}
      />
      <ProductShelf
        title="Ofertas"
        description="Precios especiales por tiempo limitado."
        seeAllHref="/catalogo?etiqueta=OFERTA"
        products={ofertas}
        showPrices={settings.showPrices}
      />
      <ProductShelf
        title="Tendencias"
        description="Lo que más se está pidiendo esta temporada."
        seeAllHref="/catalogo?etiqueta=TENDENCIA"
        products={tendencias}
        showPrices={settings.showPrices}
      />

      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((benefit) => (
            <div key={benefit.title} className="border border-line p-5">
              <benefit.icon className="h-6 w-6 text-brand-primary" aria-hidden="true" />
              <h3 className="mt-3 font-display text-base font-medium text-ink">{benefit.title}</h3>
              <p className="mt-1 text-sm text-ink-soft">{benefit.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="flex flex-col items-center gap-4 border border-line bg-brand-accent/60 p-8 text-center sm:p-12">
          <h2 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
            ¿Buscas algo puntual?
          </h2>
          <p className="max-w-xl text-ink-soft">
            Cuéntanos qué necesitas por WhatsApp y te ayudamos a encontrarlo en nuestro catálogo.
          </p>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="focus-ring inline-flex items-center justify-center gap-2 bg-[#25D366] px-6 py-3 text-xs font-bold uppercase tracking-[0.1em] text-[#0b3d24] hover:brightness-95"
          >
            Escribir por WhatsApp
          </a>
        </div>
      </section>
    </div>
  );
}
