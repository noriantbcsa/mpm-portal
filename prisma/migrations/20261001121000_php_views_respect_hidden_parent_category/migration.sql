-- Alinea las vistas de integración PHP con el sitio público: una
-- subcategoría (y sus productos) tampoco es pública si su categoría padre
-- está oculta. Ver PUBLIC_CATEGORY_WHERE en src/lib/constants.ts.
-- Mismas columnas y orden que la versión anterior (CREATE OR REPLACE VIEW
-- no permite cambiarlas).

CREATE OR REPLACE VIEW integration.catalog_categories
WITH (security_barrier = true)
AS
SELECT
  c."id" AS id,
  c."name" AS name,
  c."slug" AS slug,
  c."description" AS description,
  c."imageUrl" AS image_url,
  c."parentId" AS parent_id,
  c."order" AS sort_order,
  c."updatedAt" AS updated_at
FROM "Category" AS c
LEFT JOIN "Category" AS parent ON parent."id" = c."parentId"
WHERE c."isVisible" = true AND (c."parentId" IS NULL OR parent."isVisible" = true);

CREATE OR REPLACE VIEW integration.catalog_products
WITH (security_barrier = true)
AS
SELECT
  p."id" AS id,
  p."sku" AS sku,
  p."name" AS name,
  p."slug" AS slug,
  p."description" AS description,
  p."categoryId" AS category_id,
  c."name" AS category_name,
  c."slug" AS category_slug,
  p."audience"::text AS audience,
  p."status"::text AS status,
  to_jsonb(p."sizes") AS sizes,
  to_jsonb(p."colors") AS colors,
  to_jsonb(p."tags") AS tags,
  p."material" AS material,
  p."priceRef" AS price_ref,
  image.url AS primary_image_url,
  p."createdAt" AS created_at,
  p."updatedAt" AS updated_at
FROM "Product" AS p
INNER JOIN "Category" AS c ON c."id" = p."categoryId" AND c."isVisible" = true
LEFT JOIN "Category" AS parent ON parent."id" = c."parentId"
LEFT JOIN LATERAL (
  SELECT pi."url"
  FROM "ProductImage" AS pi
  WHERE pi."productId" = p."id"
  ORDER BY pi."order" ASC, pi."createdAt" ASC
  LIMIT 1
) AS image ON true
WHERE p."status" IN ('DISPONIBLE', 'BAJO_PEDIDO', 'AGOTADO')
  AND (c."parentId" IS NULL OR parent."isVisible" = true);
