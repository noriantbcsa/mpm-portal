-- Damas no tiene línea "plus": la referencia DAM-PLUS-DAMA conserva sus fotos
-- (ya sin la etiqueta "PLUS" impresa) pero pierde la palabra "plus" del nombre.
-- Las tallas quedan en XS–L por la migración 20261024090000.
UPDATE "Product"
SET "name" = 'camisa manga larga dama'
WHERE "sku" = 'DAM-PLUS-DAMA' AND "name" = 'camisa manga larga dama plus';
