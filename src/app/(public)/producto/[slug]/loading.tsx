import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingProducto() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <span role="status" className="sr-only">
        Cargando producto…
      </span>
      <Skeleton className="mb-4 h-4 w-64" />
      <div className="grid gap-8 lg:grid-cols-2">
        <Skeleton className="aspect-square w-full" />
        <div className="flex flex-col gap-3">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mt-4 h-24 w-full" />
          <Skeleton className="mt-6 h-12 w-full" />
        </div>
      </div>
    </div>
  );
}
