import Image from "next/image";
import Link from "next/link";
import { IMAGE_BLUR_DATA_URL } from "@/components/ui/image-placeholder";

export function CategoryCard({
  name,
  slug,
  imageUrl,
}: {
  name: string;
  slug: string;
  imageUrl: string | null;
}) {
  return (
    <Link
      href={`/catalogo/${slug}`}
      className="focus-ring group relative flex min-h-80 items-end overflow-hidden bg-brand-primary sm:min-h-[34rem]"
    >
      {imageUrl && (
        <Image
          src={imageUrl}
          alt=""
          fill
          sizes="(min-width: 640px) 50vw, 100vw"
          placeholder="blur"
          blurDataURL={IMAGE_BLUR_DATA_URL}
          decoding="async"
          className="object-cover object-[center_18%] opacity-95 scale-105 transition-transform duration-300 group-hover:scale-110"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
      <span className="relative z-10 p-4 font-display text-xl font-semibold tracking-[-0.03em] text-white sm:text-2xl">
        {name}
      </span>
    </Link>
  );
}
