import type { Audience, ProductTagType } from "@prisma/client";

import { AUDIENCE_LABELS, PRODUCT_TAG_LABELS } from "@/lib/constants";
import { formatCatalogColor } from "@/lib/catalog-colors";
import { toArray, toPositiveInt, toSingle, type RawSearchParams } from "@/lib/search-params";

export type CatalogSort = "relevancia" | "nombre-asc" | "recientes";

const CATALOG_SORTS: readonly CatalogSort[] = ["relevancia", "nombre-asc", "recientes"];
const MAX_QUERY_LENGTH = 100;
const MAX_MULTI_VALUES = 20;

export type CatalogParams = {
  q?: string;
  publico?: Audience;
  talla: string[];
  color: string[];
  etiqueta: ProductTagType[];
  orden?: CatalogSort;
  pagina: number;
};

function isAudience(value: string): value is Audience {
  return Object.hasOwn(AUDIENCE_LABELS, value);
}

function isProductTag(value: string): value is ProductTagType {
  return Object.hasOwn(PRODUCT_TAG_LABELS, value);
}

function isCatalogSort(value: string): value is CatalogSort {
  return (CATALOG_SORTS as readonly string[]).includes(value);
}

/**
 * Lee los filtros del catálogo desde la URL. Los valores llegan sin control
 * (enlaces viejos, bots, URLs editadas a mano): un enum desconocido no debe
 * llegar a Prisma — que lo rechazaría con un error 500 — sino ignorarse.
 */
export function parseCatalogParams(params: RawSearchParams): CatalogParams {
  const rawQuery = toSingle(params.q)?.trim().slice(0, MAX_QUERY_LENGTH);
  const publico = toSingle(params.publico);
  const orden = toSingle(params.orden);

  return {
    q: rawQuery || undefined,
    publico: publico && isAudience(publico) ? publico : undefined,
    talla: [...new Set(toArray(params.talla))].slice(0, MAX_MULTI_VALUES),
    color: [...new Set(toArray(params.color).map(formatCatalogColor))].slice(0, MAX_MULTI_VALUES),
    etiqueta: [...new Set(toArray(params.etiqueta).filter(isProductTag))],
    orden: orden && isCatalogSort(orden) ? orden : undefined,
    pagina: toPositiveInt(params.pagina, 1),
  };
}

/** Catálogo sin filtros (para URLs canónicas). */
export const EMPTY_FILTERS: CatalogParams = { talla: [], color: [], etiqueta: [], pagina: 1 };

/** Construye la URL de una página del catálogo conservando los filtros activos. */
export function buildCatalogHref(basePath: string, params: CatalogParams, page: number) {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.publico) search.set("publico", params.publico);
  params.talla.forEach((t) => search.append("talla", t));
  params.color.forEach((c) => search.append("color", c));
  params.etiqueta.forEach((e) => search.append("etiqueta", e));
  if (params.orden) search.set("orden", params.orden);
  if (page > 1) search.set("pagina", String(page));
  const qs = search.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

/** Hay filtros o búsqueda: la página es una variante, no contenido canónico. */
export function hasCatalogFilters(params: CatalogParams) {
  return Boolean(
    params.q || params.publico || params.talla.length || params.color.length || params.etiqueta.length || params.orden,
  );
}
