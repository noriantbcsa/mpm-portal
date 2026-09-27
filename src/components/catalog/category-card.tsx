import Image from "next/image";
import Link from "next/link";

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
      className="focus-ring group relative flex aspect-[4/5] items-end overflow-hidden bg-brand-primary"
    >
      {imageUrl && (
        <Image
          src={imageUrl}
          alt=""
          fill
          sizes="(min-width: 1024px) 20vw, 40vw"
          className="object-cover opacity-90 transition-transform duration-300 group-hover:scale-105"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
      <span className="relative z-10 p-4 font-display text-xl font-semibold tracking-[-0.03em] text-white sm:text-2xl">
        {name}
      </span>
    </Link>
  );
}
