-- Organiza las tallas del catálogo: Damas XS–L, Caballero M–XL y las líneas
-- plus / XXL únicamente en XXL. Las referencias de talla única no se tocan.
-- No se modifica "updatedAt": es el orden por defecto del catálogo y el
-- `lastmod` del sitemap, y un cambio de tallas no debe reordenarlos.
UPDATE "Product"
SET "sizes" = ARRAY['XXL']
WHERE "sku" IN ('DAM-PLUS-DAMA', 'CAB-CMCH-XXL', 'CAB-CMLH-XXL');

UPDATE "Product"
SET "sizes" = ARRAY['XS', 'S', 'M', 'L']
WHERE "audience" = 'MUJER'
  AND "sku" LIKE 'DAM-%'
  AND "sku" NOT IN ('DAM-PLUS-DAMA', 'DAM-UNICA', 'DAM-R-UNICA');

UPDATE "Product"
SET "sizes" = ARRAY['M', 'L', 'XL']
WHERE "audience" = 'HOMBRE'
  AND "sku" LIKE 'CAB-%'
  AND "sku" NOT IN ('CAB-CMCH-XXL', 'CAB-CMLH-XXL');
