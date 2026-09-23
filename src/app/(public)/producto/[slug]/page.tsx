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
    <div className="mx-auto max-w-6xl px-4 py-8">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name,
          sku: product.sku,
          description: product.description,
          image: product.images.map((i) => i.url),
          category: product.category.name,
          url: `${siteUrl}/producto/${product.slug}`,
          offers: {
            "@type": "Offer",
            availability:
              product.status === "AGOTADO"
                ? "https://schema.org/OutOfStock"
                : product.status === "BAJO_PEDIDO"
                  ? "https://schema.org/PreOrder"
                  : "https://schema.org/InStock",
            priceCurrency: "COP",
            price: product.priceRef ? Number(product.priceRef).toFixed(0) : undefined,
            url: `${siteUrl}/producto/${product.slug}`,
          },
        }}
      />

      <nav aria-label="Ruta de navegación" className="mb-4 text-sm text-ink-soft">
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

        <h1 className="mt-3 font-display text-2xl font-black uppercase tracking-[-0.05em] text-ink sm:text-3xl">
          {product.name}
        </h1>
        <p className="mt-1 text-sm text-ink-soft">Referencia {product.sku}</p>
        {price && <p className="mt-3 text-2xl font-semibold text-brand-primary">{price}</p>}

        <p className="mt-4 whitespace-pre-line text-ink-soft">{product.description}</p>

        <dl className="mt-5 grid grid-cols-2 border-y border-line text-sm sm:grid-cols-4">
          <div className="border-b border-r border-line p-3 sm:border-b-0">
            <dt className="text-[10px] font-bold uppercase tracking-[0.1em] text-ink-soft">Público</dt>
            <dd className="text-ink-soft">{AUDIENCE_LABELS[product.audience]}</dd>
          </div>
          {product.material && (
            <div className="border-b border-r border-line p-3 sm:border-b-0">
              <dt className="text-[10px] font-bold uppercase tracking-[0.1em] text-ink-soft">Material</dt>
              <dd className="text-ink-soft">{product.material}</dd>
            </div>
          )}
          <div className="border-b border-r border-line p-3 sm:border-b-0">
            <dt className="text-[10px] font-bold uppercase tracking-[0.1em] text-ink-soft">Vistas</dt>
            <dd className="text-ink-soft">{product.images.length} fotos reales</dd>
          </div>
          <div className="border-b border-line p-3 sm:border-b-0">
            <dt className="text-[10px] font-bold uppercase tracking-[0.1em] text-ink-soft">Colores</dt>
            <dd className="text-ink-soft">{product.colors.length} registrados</dd>
          </div>
        </dl>
      </ProductPurchasePanel>

      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="font-display text-xl font-semibold text-ink">También te puede interesar</h2>
          <div className="mt-4">
            <ProductGrid products={related} showPrices={settings.showPrices} />
          </div>
        </section>
      )}
    </div>
  );
}
