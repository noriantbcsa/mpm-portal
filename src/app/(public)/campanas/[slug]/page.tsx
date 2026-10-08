import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getLiveCampaignBySlug } from "@/lib/campaigns";
import { listProducts } from "@/lib/products";
import { getSiteSettings } from "@/lib/site-config";
import { formatDate } from "@/lib/format";
import { ProductGrid } from "@/components/catalog/product-grid";
import { IMAGE_BLUR_DATA_URL } from "@/components/ui/image-placeholder";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

const getCampaign = getLiveCampaignBySlug;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const campaign = await getCampaign(slug);
  if (!campaign) return {};
  return {
    title: campaign.name,
    description: campaign.description ?? undefined,
    alternates: { canonical: `/campanas/${campaign.slug}` },
  };
}

export default async function CampanaPage({ params }: PageProps) {
  const { slug } = await params;
  const [campaign, settings] = await Promise.all([getCampaign(slug), getSiteSettings()]);
  if (!campaign) notFound();

  const { items, total } = await listProducts({ campaignSlug: slug, pageSize: 60 });
  return (
    <div className="campaign-page">
      <section className={`campaign-hero ${campaign.bannerImageUrl ? "campaign-hero--image" : ""}`}>
        {campaign.bannerImageUrl && (
          <Image src={campaign.bannerImageUrl} alt="" fill priority sizes="100vw" placeholder="blur" blurDataURL={IMAGE_BLUR_DATA_URL} decoding="async" className="-z-10 object-cover object-center" />
        )}
        <div className={`mx-auto flex max-w-6xl flex-col justify-end gap-4 px-4 py-14 sm:py-20 ${campaign.bannerImageUrl ? "min-h-[26rem] sm:min-h-[32rem]" : "min-h-[16rem]"}`}>
          <p className="campaign-kicker">Campaña</p>
          <h1 className="max-w-3xl font-display text-4xl font-semibold uppercase leading-tight tracking-[0.04em] sm:text-6xl">{campaign.name}</h1>
          {campaign.description && <p className="max-w-xl text-base leading-7 opacity-90 sm:text-lg">{campaign.description}</p>}
          {(campaign.startDate || campaign.endDate) && (
            <p className="text-sm uppercase tracking-[0.12em] opacity-75">
              {campaign.startDate ? formatDate(campaign.startDate) : "—"}
              {campaign.endDate ? ` — ${formatDate(campaign.endDate)}` : ""}
            </p>
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
        <div className="mb-6 flex items-baseline justify-between gap-4 border-b border-line pb-3">
          <h2 className="font-display text-lg font-semibold uppercase tracking-[0.1em] text-ink">Colección</h2>
          <p className="text-sm text-ink-soft">{total} {total === 1 ? "referencia" : "referencias"}</p>
        </div>
        <ProductGrid products={items} showPrices={settings.showPrices} />
      </div>
    </div>
  );
}
