-- Retira el marcador "Consultar disponibilidad" que sembraba el seed:
-- las referencias sin talla conocida pasan a la escala XS–XXL, el marcador de
-- color se elimina y se quita la frase de relleno de las descripciones sembradas.
UPDATE "Product"
SET "sizes" = ARRAY['XS', 'S', 'M', 'L', 'XL', 'XXL']
WHERE "sizes" = ARRAY['Consultar disponibilidad'];

UPDATE "Product"
SET "sizes" = array_remove("sizes", 'Consultar disponibilidad')
WHERE 'Consultar disponibilidad' = ANY("sizes");

UPDATE "Product"
SET "colors" = array_remove("colors", 'Consultar disponibilidad')
WHERE 'Consultar disponibilidad' = ANY("colors");

UPDATE "Product"
SET "description" = btrim(replace("description", 'Consulta disponibilidad de talla y color con un asesor MPM.', ''))
WHERE "description" LIKE '%Consulta disponibilidad de talla y color con un asesor MPM.%'
  AND btrim(replace("description", 'Consulta disponibilidad de talla y color con un asesor MPM.', '')) <> '';
