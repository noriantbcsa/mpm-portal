-- Sincroniza únicamente las referencias de la tabla de precios entregada por
-- MPM. No inserta ni elimina productos, así que se puede ejecutar con
-- seguridad sobre un catálogo existente en producción.
WITH catalog (sku, name, "priceRef", "priceWholesale") AS (
  VALUES
    ('DAM-CMLD', 'camisa manga larga dama', 65000.00, 34000.00),
    ('DAM-CMCD', 'camisa manga corta dama', 60000.00, 31000.00),
    ('DAM-BMC', 'blusón manga corta', 60000.00, 35000.00),
    ('DAM-CCP-CAMISON-COLA-DE-PATO', 'camisón cola de pato', 65000.00, 38000.00),
    ('DAM-CMLR-NUEVO-LANZAMIENTO-DAMAS', 'camisa manga larga rayada dama', 65000.00, 38000.00),
    ('DAM-CMCRD', 'camisa manga corta rayada dama', 60000.00, 35000.00),
    ('DAM-SHORT-DOBLE-CORREA', 'short doble correa', 50000.00, 27000.00),
    ('DAM-R-UNICA', 'camisa talla única rayada', 60000.00, 32000.00),
    ('DAM-UNICA', 'camisa talla única', 55000.00, 29000.00),
    ('DAM-OVCML', 'camisa corta manga larga', 65000.00, 34000.00),
    ('DAM-PLUS-DAMA', 'camisa manga larga dama plus', 65000.00, 38000.00),
    ('CAB-CMLH', 'camisa manga larga hombre', 70000.00, 38000.00),
    ('CAB-CMCH', 'camisa manga corta hombre', 65000.00, 36000.00),
    ('CAB-CMLRH', 'camisa manga larga rayada hombre', 70000.00, 40000.00),
    ('CAB-CMCRH', 'camisa manga corta rayada hombre', 65000.00, 38000.00),
    ('CAB-CMCH-XXL', 'camisa manga corta hombre XXL', 70000.00, 40000.00),
    ('CAB-CMLH-XXL', 'camisa manga larga hombre XXL', 75000.00, 42000.00)
)
UPDATE "Product" AS product
SET
  "name" = catalog.name,
  "priceRef" = catalog."priceRef",
  "priceWholesale" = catalog."priceWholesale",
  "updatedAt" = NOW()
FROM catalog
WHERE product.sku = catalog.sku;

-- Los precios de la tabla son públicos: se muestran tanto en las fichas como
-- en el catálogo. Si la configuración aún no existe, el seed la crea.
UPDATE "SiteSettings"
SET "showPrices" = true, "updatedAt" = NOW()
WHERE id = 'default';
