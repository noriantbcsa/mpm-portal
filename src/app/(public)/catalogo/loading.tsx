import { Skeleton, ProductGridSkeleton } from "@/components/ui/skeleton";

export default function LoadingCatalogo() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <span role="status" className="sr-only">
        Cargando catálogo…
      </span>
      <Skeleton className="h-8 w-64" />
      <Skeleton className="mt-2 h-4 w-96 max-w-full" />
      <div className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr]">
        <Skeleton className="h-96 w-full" />
        <ProductGridSkeleton count={8} />
      </div>
    </div>
  );
}
