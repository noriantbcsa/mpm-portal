-- Mejora el contexto visible y los metadatos de las colecciones públicas.
-- Solo se reemplazan las descripciones genéricas creadas por el catálogo
-- inicial; una descripción personalizada desde administración se conserva.
UPDATE "Category"
SET
  "description" = CASE
    WHEN slug = 'damas' THEN 'Compra camisas, blusones y prendas para dama en MPM. Elige talla y color, al detal o al por mayor.'
    WHEN slug = 'caballero' THEN 'Compra camisas y prendas para caballero en MPM. Elige talla y color, al detal o al por mayor.'
    WHEN slug = 'damas-referencias' THEN 'Prendas de dama con galería de fotos y especificaciones.'
    WHEN slug = 'caballero-referencias' THEN 'Prendas de caballero con galería de fotos y especificaciones.'
    ELSE "description"
  END,
  "updatedAt" = NOW()
WHERE
  (slug = 'damas' AND "description" = 'Colecciones de Damas.')
  OR (slug = 'caballero' AND "description" = 'Colecciones de Caballero.')
  OR (slug = 'damas-referencias' AND "description" = 'Modelos reales de Damas con galería de fotos y especificaciones.')
  OR (slug = 'caballero-referencias' AND "description" = 'Modelos reales de Caballero con galería de fotos y especificaciones.');
