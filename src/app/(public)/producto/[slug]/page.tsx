import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { after } from "next/server";

import {
  getProductBySlug,
  getRelatedProducts,
  incrementProductViewCount,
} from "@/lib/products";
import { getSiteSettings } from "@/lib/site-config";
import {
  AUDIENCE_LABELS,
  PRODUCT_STATUS_LABELS,
  PRODUCT_TAG_LABELS,
} from "@/lib/constants";
import { formatPrice } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { ProductPurchasePanel } from "@/components/product/product-purchase-panel";
import { ProductGrid } from "@/components/catalog/product-grid";
import { JsonLd } from "@/components/seo/json-ld";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  return {
    title: product.name,
    description: product.description.slice(0, 160),
    alternates: { canonical: `/producto/${product.slug}` },
    openGraph: {
      title: product.name,
      description: product.description.slice(0, 160),
      images: product.images[0] ? [{ url: product.images[0].url }] : undefined,
    },
  };
}

export default async function ProductoPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [related, settings] = await Promise.all([
    getRelatedProducts(product),
    getSiteSettings(),
  ]);

  after(() => incrementProductViewCount(product.id));

  const canOrder = product.status === "DISPONIBLE" || product.status === "BAJO_PEDIDO";
  const price = settings.showPrices ? formatPrice(product.priceRef ? Number(product.priceRef) : null) : null;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name,
          sku: product.sku,
          description: product.description,
          // Las fotos del catálogo local se guardan como rutas relativas;
          // schema.org espera URLs absolutas.
          image: product.images.map((i) => new URL(i.url, siteUrl).toString()),
          category: product.category.name,
          url: `${siteUrl}/producto/${product.slug}`,
          // Google exige `price` en un Offer: sin precio público (o con los
          // precios ocultos desde /admin/ajustes) no se publica la oferta.
          ...(settings.showPrices && product.priceRef
            ? {
                offers: {
                  "@type": "Offer",
                  availability:
                    product.status === "AGOTADO"
                      ? "https://schema.org/OutOfStock"
                      : product.status === "BAJO_PEDIDO"
                        ? "https://schema.org/PreOrder"
                        : "https://schema.org/InStock",
                  priceCurrency: "COP",
                  price: Number(product.priceRef).toFixed(0),
                  url: `${siteUrl}/producto/${product.slug}`,
                },
              }
            : {}),
        }}
      />

      <nav aria-label="Ruta de navegación" className="mb-6 text-xs text-ink-soft">
        <Link href="/" className="hover:text-ink">Inicio</Link>
        {" / "}
        <Link href="/catalogo" className="hover:text-ink">Catálogo</Link>
        {" / "}
        {product.category.parent && (
          <>
            <Link href={`/catalogo/${product.category.parent.slug}`} className="hover:text-ink">
              {product.category.parent.name}
            </Link>
            {" / "}
          </>
        )}
        <Link href={`/catalogo/${product.category.slug}`} className="hover:text-ink">
          {product.category.name}
        </Link>
        {" / "}
        <span className="text-ink">{product.name}</span>
      </nav>

      <ProductPurchasePanel
        images={product.images.map((i) => ({ url: i.url, alt: i.alt, color: i.color }))}
        productName={product.name}
        productId={product.id}
        slug={product.slug}
        sku={product.sku}
        sizes={product.sizes}
        colors={product.colors}
        priceRef={product.priceRef ? Number(product.priceRef) : null}
        canOrder={canOrder}
      >
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={product.status === "AGOTADO" ? "danger" : "neutral"}>
            {PRODUCT_STATUS_LABELS[product.status]}
          </Badge>
          {product.tags.map((tag) => (
            <Badge key={tag} tone="brand">
              {PRODUCT_TAG_LABELS[tag]}
            </Badge>
          ))}
        </div>

        <h1 className="mt-4 font-display text-3xl font-semibold leading-none tracking-[-0.045em] text-ink sm:text-4xl">
          {product.name}
        </h1>
        <p className="mt-2 text-xs font-medium uppercase tracking-[0.12em] text-ink-soft">Ref. {product.sku}</p>
        {price && <p className="mt-5 text-xl font-semibold text-ink">{price}</p>}

        <p className="mt-5 whitespace-pre-line text-sm leading-6 text-ink-soft">{product.description}</p>

        <div className="mt-6 divide-y border-y border-line">
          <details className="group py-4" open>
            <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-bold uppercase tracking-[0.12em] text-ink">
              Detalles de la prenda <span className="text-lg font-normal transition-transform group-open:rotate-45">+</span>
            </summary>
            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <div><dt className="text-[10px] font-bold uppercase tracking-[0.1em] text-ink-soft">Público</dt><dd className="mt-1 text-ink">{AUDIENCE_LABELS[product.audience]}</dd></div>
              {product.material && <div><dt className="text-[10px] font-bold uppercase tracking-[0.1em] text-ink-soft">Material</dt><dd className="mt-1 text-ink">{product.material}</dd></div>}
              <div><dt className="text-[10px] font-bold uppercase tracking-[0.1em] text-ink-soft">Referencia</dt><dd className="mt-1 text-ink">{product.sku}</dd></div>
              <div><dt className="text-[10px] font-bold uppercase tracking-[0.1em] text-ink-soft">Variantes</dt><dd className="mt-1 text-ink">{product.colors.length} colores</dd></div>
            </dl>
          </details>
          <details className="group py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-bold uppercase tracking-[0.12em] text-ink">
              Compra y entrega <span className="text-lg font-normal transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 text-sm leading-6 text-ink-soft">Agrega tus prendas al carrito y envía tu solicitud. Nuestro equipo confirma disponibilidad, valores y entrega por WhatsApp.</p>
          </details>
        </div>
      </ProductPurchasePanel>

      {related.length > 0 && (
        <section className="mt-16 border-t border-line pt-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-soft">Para combinar</p>
          <h2 className="mt-1 font-display text-2xl font-semibold tracking-[-0.03em] text-ink">También te puede interesar</h2>
          <div className="mt-6">
            <ProductGrid products={related} showPrices={settings.showPrices} />
          </div>
        </section>
      )}
    </div>
  );
}
