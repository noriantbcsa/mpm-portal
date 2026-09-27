import type { ProductListItem } from "@/lib/products";
import { ProductCard } from "@/components/catalog/product-card";
import { EmptyState } from "@/components/ui/empty-state";

export function ProductGrid({
  products,
  showPrices,
}: {
  products: ProductListItem[];
  showPrices: boolean;
}) {
  if (products.length === 0) {
    return (
      <EmptyState
        title="No encontramos prendas con esos filtros"
        description="Prueba quitando algún filtro o buscando con otra palabra. También puedes escribirnos por WhatsApp y te ayudamos a encontrar lo que necesitas."
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-2 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4 lg:gap-x-6 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} showPrices={showPrices} />
      ))}
    </div>
  );
}
