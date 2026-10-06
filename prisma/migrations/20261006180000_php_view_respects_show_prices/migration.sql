-- La vista de integración PHP exponía `priceRef` siempre, aunque el sitio
-- público oculte los precios (SiteSettings.showPrices, apagado por defecto).
-- Ahora `price_ref` solo tiene valor cuando el sitio también lo muestra; en
-- caso contrario es NULL. La subconsulta la evalúa el propietario de la
-- vista, así que el rol de solo lectura de PHP no necesita acceso a
-- "SiteSettings". Mismas columnas y orden que la versión anterior
-- (CREATE OR REPLACE VIEW no permite cambiarlas).

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
  -- El cast conserva el tipo exacto de la columna (numeric(12,2)): sin él,
  -- CASE devuelve numeric a secas y PostgreSQL rechaza el cambio de tipo.
  (CASE
    WHEN (SELECT s."showPrices" FROM "SiteSettings" AS s WHERE s."id" = 'default') IS TRUE
      THEN p."priceRef"
  END)::numeric(12,2) AS price_ref,
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
