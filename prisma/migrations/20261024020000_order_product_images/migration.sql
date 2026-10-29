-- El prefijo productId conserva las búsquedas por producto; las columnas
-- restantes permiten obtener la primera foto sin ordenar todas las variantes.
CREATE INDEX "ProductImage_productId_order_createdAt_idx"
  ON "ProductImage"("productId", "order", "createdAt");

DROP INDEX "ProductImage_productId_idx";
