import {
  AUDIENCE_LABELS,
  CATALOG_AUDIENCES,
  PRODUCT_TAG_LABELS,
} from "@/lib/constants";
import type { Audience, ProductTagType } from "@prisma/client";
import { Button, LinkButton } from "@/components/ui/button";
import { getCatalogColorSwatch } from "@/lib/catalog-colors";

export type ActiveFilters = {
  q?: string;
  categoria?: string;
  publico?: Audience;
  talla: string[];
  color: string[];
  etiqueta: ProductTagType[];
  orden?: string;
};

const AUDIENCE_OPTIONS = CATALOG_AUDIENCES.map((value) => [value, AUDIENCE_LABELS[value]] as [Audience, string]);
const TAG_OPTIONS = Object.entries(PRODUCT_TAG_LABELS) as [ProductTagType, string][];

export function FiltersForm({
  active,
  options,
}: {
  active: ActiveFilters;
  options: { sizes: string[]; colors: string[]; tags: ProductTagType[] };
}) {
  // Solo etiquetas que alguna prenda tiene (más las activas, para poder quitarlas).
  const visibleTagOptions = TAG_OPTIONS.filter(([value]) => options.tags.includes(value) || active.etiqueta.includes(value));

  return (
    <form
      method="GET"
      action={active.categoria ? `/catalogo/${active.categoria}` : "/catalogo"}
      className="catalog-filters flex flex-col gap-6 border-y border-line bg-paper py-4 lg:border"
      aria-label="Filtros del catálogo"
    >
      {active.q && <input type="hidden" name="q" value={active.q} />}

      <fieldset>
        <legend className="text-sm font-semibold text-ink">Ordenar por</legend>
        <select
          name="orden"
          aria-label="Ordenar por"
          defaultValue={active.orden ?? "relevancia"}
          className="focus-ring mt-2 w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm"
        >
          <option value="relevancia">Actualizados recientemente</option>
          <option value="recientes">Recién agregados</option>
          <option value="nombre-asc">Nombre (A-Z)</option>
        </select>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-semibold text-ink">Público</legend>
        <div className="mt-2 flex flex-col gap-1.5">
          <label className="focus-ring-within flex min-h-11 items-center gap-2 text-sm text-ink-soft">
            <input type="radio" name="publico" value="" defaultChecked={!active.publico} />
            Todos
          </label>
          {AUDIENCE_OPTIONS.map(([value, label]) => (
            <label key={value} className="focus-ring-within flex min-h-11 items-center gap-2 text-sm text-ink-soft">
              <input
                type="radio"
                name="publico"
                value={value}
                defaultChecked={active.publico === value}
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      {visibleTagOptions.length > 0 && (
      <fieldset>
        <legend className="text-sm font-semibold text-ink">Etiquetas</legend>
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1.5">
          {visibleTagOptions.map(([value, label]) => (
            <label key={value} className="focus-ring-within flex min-h-11 items-center gap-2 text-sm text-ink-soft">
              <input
                type="checkbox"
                name="etiqueta"
                value={value}
                defaultChecked={active.etiqueta.includes(value)}
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
      )}

      <fieldset>
        <legend className="text-sm font-semibold text-ink">Talla</legend>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {options.sizes.map((size) => (
            <label
              key={size}
              className="focus-ring-within flex min-h-11 items-center gap-1.5 rounded-full border border-line px-3 py-1 text-xs text-ink-soft has-checked:border-brand-primary has-checked:bg-brand-primary/10 has-checked:text-brand-primary"
            >
              <input
                type="checkbox"
                name="talla"
                value={size}
                defaultChecked={active.talla.includes(size)}
                className="sr-only"
              />
              {size}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-semibold text-ink">Color</legend>
        <div className="mt-2 flex flex-wrap gap-2" aria-label="Elegir color">
          <CatalogColorFilterOption color="" selected={!active.color[0]} label="Todos" />
          {options.colors.map((color) => (
            <CatalogColorFilterOption key={color} color={color} selected={active.color[0] === color} label={color} />
          ))}
        </div>
      </fieldset>

      <div className="flex gap-2">
        <Button type="submit" className="flex-1">
          Aplicar filtros
        </Button>
        <LinkButton href={active.categoria ? `/catalogo/${active.categoria}` : "/catalogo"} variant="ghost">
          Limpiar
        </LinkButton>
      </div>
    </form>
  );
}

function CatalogColorFilterOption({ color, selected, label }: { color: string; selected: boolean; label: string }) {
  const swatch = color ? getCatalogColorSwatch(color) : null;
  const style = swatch
    ? { backgroundColor: swatch.background, borderColor: selected ? "#101417" : swatch.foreground, color: swatch.foreground }
    : undefined;

  return (
    <label
      className={`focus-ring-within flex min-h-11 cursor-pointer items-center border px-3 py-2 text-center text-xs font-bold uppercase tracking-[0.06em] transition-[background-color,color,border-color,box-shadow,filter] hover:brightness-95 ${
        selected ? "ring-2 ring-ink ring-offset-2" : swatch ? "" : "border-line bg-paper text-ink-soft"
      }`}
      style={style}
    >
      <input type="radio" name="color" value={color} defaultChecked={selected} className="sr-only" />
      {label}
    </label>
  );
}
