import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { listProducts } from "@/lib/products";
import { getSiteSettings } from "@/lib/site-config";
import { formatDate } from "@/lib/format";
import { ProductGrid } from "@/components/catalog/product-grid";
import { IMAGE_BLUR_DATA_URL } from "@/components/ui/image-placeholder";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

async function getCampaign(slug: string) {
  return prisma.campaign.findUnique({ where: { slug }, include: { priorityCategories: true } });
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const campaign = await getCampaign(slug);
  if (!campaign) return {};
  return {
    title: campaign.name,
    description: campaign.description ?? undefined,
  };
}

export default async function CampanaPage({ params }: PageProps) {
  const { slug } = await params;
  const [campaign, settings] = await Promise.all([getCampaign(slug), getSiteSettings()]);
  if (!campaign) notFound();

  const { items, total } = await listProducts({ campaignSlug: slug, pageSize: 60 });
  const campaignStyle = {
    "--campaign-primary": campaign.colorPrimary ?? "var(--brand-primary)",
    "--campaign-secondary": campaign.colorSecondary ?? "var(--brand-secondary)",
  } as CSSProperties;

  return (
    <div className="campaign-page" style={campaignStyle}>
      <section className="campaign-showcase relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-14 lg:grid-cols-2">
          <div className="relative z-10 text-white">
            <p className="campaign-kicker">Campaña especial</p>
            <h1 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">{campaign.name}</h1>
            {campaign.description && <p className="mt-4 max-w-md text-white/85">{campaign.description}</p>}
            {(campaign.startDate || campaign.endDate) && (
              <p className="mt-3 text-sm text-white/70">
                Vigencia:{" "}
                {campaign.startDate ? formatDate(campaign.startDate) : "—"}
                {campaign.endDate ? ` al ${formatDate(campaign.endDate)}` : ""}
              </p>
            )}
            <p className="mt-6 inline-flex w-fit border border-white/30 bg-white/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-white">
              {total} {total === 1 ? "referencia seleccionada" : "referencias seleccionadas"}
            </p>
          </div>
          {campaign.bannerImageUrl && (
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl">
              <Image src={campaign.bannerImageUrl} alt="" fill sizes="(min-width: 1024px) 40vw, 90vw" placeholder="blur" blurDataURL={IMAGE_BLUR_DATA_URL} decoding="async" className="object-cover" />
            </div>
          )}
        </div>
      </section>

      {campaign.priorityCategories.length > 0 && (
        <div className="mx-auto max-w-6xl px-4 pt-8">
          <div className="flex flex-wrap gap-2">
            {campaign.priorityCategories.map((category) => (
              <Link
                key={category.id}
                href={`/catalogo/${category.slug}`}
                className="focus-ring rounded-full border border-line px-3.5 py-1.5 text-sm text-ink-soft hover:bg-brand-accent"
              >
                {category.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mx-auto max-w-6xl px-4 py-10">
        <h2 className="mb-4 font-display text-xl font-semibold text-ink">Prendas seleccionadas para esta campaña</h2>
        <ProductGrid products={items} showPrices={settings.showPrices} />
      </div>
    </div>
  );
}
