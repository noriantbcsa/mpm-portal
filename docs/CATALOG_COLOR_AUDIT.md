# Auditoría de colores del catálogo · 17 de octubre de 2026

Se inspeccionaron visualmente las 360 fotos originales, distribuidas en 18 prendas.
El registro por archivo está en `src/lib/catalog-photo-colors.json`. Las fotos no
fueron recoloreadas ni sustituidas. Los nombres existentes se conservaron,
normalizando abreviaturas, acentos y duplicados de archivo. Para 192 fotos sin
etiqueta (nombres numéricos, UUID, WhatsApp o photo_) se asignó el color visible
usando la paleta del catálogo. Esas denominaciones son una clasificación visual,
no una medición del tejido ni una comprobación de existencias.

## Hallazgos corregidos

- Turquí se convertía erróneamente en Turquesa en los filtros y las muestras.
  Ahora son dos opciones distintas: azul oscuro y turquesa.
- Celeste 4, Celeste 4.1, Cereza 1 y otras variantes numéricas aparecían como
  colores diferentes. Se agrupan conservando todas sus fotos.
- Botella/V. Botella y otros alias no coincidían en todos los puntos del flujo.
  La comparación usa la misma normalización para opciones, fotos y filtros.
- Muestras como Hoja Seca, Cacao, Café, Oliva y Verde Esmeralda no representaban
  la familia de color de las fotos entregadas. Se ajustaron las muestras de UI.
- Las prendas con archivos sin etiqueta no permitían elegir sus colores.
  La migración enlaza cada foto original con su color y completa sus opciones.
- La galería mostraba solamente la primera foto. Ahora ofrece miniaturas de
  las vistas correspondientes al color seleccionado.
- Si falta una foto del color pedido, no se usa una foto etiquetada con otro
  color. El carrito tampoco recibe la imagen de una variante diferente.

## Cobertura

| Prenda | Fotos | Opciones de color |
| --- | ---: | ---: |
| Caballero CMCH | 20 | 18 |
| Caballero CMCH XXL | 11 | 11 |
| Caballero CMCRH | 6 | 6 |
| Caballero CMLH | 22 | 20 |
| Caballero CMLH XXL | 12 | 12 |
| Caballero CMLRH | 6 | 6 |
| Damas BMC | 35 | 23 |
| Damas CCP | 12 | 12 |
| Damas CMCD | 40 | 36 |
| Damas CMCRD | 6 | 5 |
| Damas CMLD | 47 | 36 |
| Damas CMLR | 30 | 9 |
| Damas CMLRD | 6 | 6 |
| Damas OVCML | 25 | 24 |
| Damas PLUS | 22 | 22 |
| Damas R-UNICA | 8 | 8 |
| Damas SHORT | 6 | 6 |
| Damas UNICA | 46 | 34 |
| **Total** | **360** | **294** |

Las prendas rayadas se clasifican por el color de su tejido; las fotos de shorts,
por el short, independientemente de la camisa con la que esté combinado.

## Verificación mantenida en el repositorio

`tests/catalog-photo-colors.test.ts` comprueba la cobertura de los archivos,
las asociaciones de las 18 prendas, que las 360 fotos son alcanzables desde sus
opciones y que las etiquetas de las muestras tienen contraste mínimo de 4.5:1.
`tests/catalog-colors.test.ts` comprueba alias, duplicados, la separación de
Turquí/Turquesa y la ausencia de sustituciones por fotos de otro color.

La migración modifica únicamente etiquetas originales o vacías de los archivos
conocidos. Mantiene las etiquetas de fotos modificadas manualmente y las opciones
adicionales de administración. No modifica precios, disponibilidad ni fotografías.
El seed usa el mismo registro para no perder las asociaciones al importar.

El recorrido adicional en Chromium sobre la compilación de producción local
comprobó las 294 selecciones y abrió las 360 vistas. Verificó por URL que cada
foto perteneciera al color elegido, el paso de Turquí y Turquesa al carrito y
la ausencia de desbordamiento horizontal a 360 px. No hubo excepciones de
JavaScript en ese recorrido. Las peticiones de precarga canceladas al cambiar
de página no se consideran fallos de navegación.
