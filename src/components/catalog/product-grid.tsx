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
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} showPrices={showPrices} />
      ))}
    </div>
  );
}
