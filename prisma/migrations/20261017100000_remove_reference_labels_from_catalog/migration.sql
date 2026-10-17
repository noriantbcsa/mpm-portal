-- El catálogo público se comunica por el nombre de la prenda, no por un
-- código interno. Actualiza solo las referencias comerciales definidas por
-- MPM, sin insertar ni borrar productos.
WITH catalog (sku, description) AS (
  VALUES
    ('DAM-CMLD', 'Elaborado en popelina stretch.'),
    ('DAM-CMCD', 'Elaborado en popelina stretch.'),
    ('DAM-BMC', 'Elaborado en popelina stretch.'),
    ('DAM-CCP-CAMISON-COLA-DE-PATO', 'Elaborado en popelina stretch.'),
    ('DAM-CMLR-NUEVO-LANZAMIENTO-DAMAS', 'Elaborado en popelina stretch.'),
    ('DAM-CMCRD', 'Elaborado en popelina stretch.'),
    ('DAM-SHORT-DOBLE-CORREA', 'Elaborado en popelina stretch.'),
    ('DAM-R-UNICA', 'Elaborado en popelina stretch.'),
    ('DAM-UNICA', 'Elaborado en popelina stretch.'),
    ('DAM-OVCML', 'Elaborado en popelina stretch.'),
    ('DAM-PLUS-DAMA', 'Elaborado en popelina stretch.'),
    ('CAB-CMLH', 'Elaborado en popelina stretch.'),
    ('CAB-CMCH', 'Elaborado en popelina stretch.'),
    ('CAB-CMLRH', 'Elaborado en popelina stretch.'),
    ('CAB-CMCRH', 'Elaborado en popelina stretch.'),
    ('CAB-CMCH-XXL', 'Elaborado en popelina stretch.'),
    ('CAB-CMLH-XXL', 'Elaborado en popelina stretch.')
)
UPDATE "Product" AS product
SET "description" = catalog.description, "updatedAt" = NOW()
FROM catalog
WHERE product.sku = catalog.sku;

UPDATE "ProductImage" AS image
SET "alt" = product.name || CASE
  WHEN image.color IS NOT NULL THEN ' · color ' || image.color
  ELSE ' · vista ' || (image."order" + 1)::text
END
FROM "Product" AS product
WHERE image."productId" = product.id
  AND product.sku IN (
    'DAM-CMLD', 'DAM-CMCD', 'DAM-BMC', 'DAM-CCP-CAMISON-COLA-DE-PATO',
    'DAM-CMLR-NUEVO-LANZAMIENTO-DAMAS', 'DAM-CMCRD', 'DAM-SHORT-DOBLE-CORREA',
    'DAM-R-UNICA', 'DAM-UNICA', 'DAM-OVCML', 'DAM-PLUS-DAMA', 'CAB-CMLH',
    'CAB-CMCH', 'CAB-CMLRH', 'CAB-CMCRH', 'CAB-CMCH-XXL', 'CAB-CMLH-XXL'
  );

UPDATE "Category"
SET "name" = CASE
  WHEN slug = 'damas-referencias' THEN 'Catálogo Damas'
  WHEN slug = 'caballero-referencias' THEN 'Catálogo Caballero'
  ELSE "name"
END,
"updatedAt" = NOW()
WHERE slug IN ('damas-referencias', 'caballero-referencias')
  AND "name" IN ('Referencias Damas', 'Referencias Caballero');
