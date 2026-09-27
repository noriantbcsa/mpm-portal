-- Corrige los textos provisionales de la primera siembra. Solo toca los
-- valores anteriores, para no reemplazar información personalizada desde el
-- panel de administración.
UPDATE "SiteSettings"
SET "address" = 'C.C. Visto, Local 3163, piso 3 · Bogotá Centro, Bogotá, Colombia'
WHERE "id" = 'default'
  AND ("address" IS NULL OR "address" = 'Barranquilla, Colombia');

UPDATE "SiteSettings"
SET "footerText" = 'MPM · Moda y estilo día a día. Atención al detal y al por mayor.'
WHERE "id" = 'default'
  AND "footerText" = 'MPM Fábrica de ropa. Atención comercial personalizada.';
