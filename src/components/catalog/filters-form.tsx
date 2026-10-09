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
  options: { sizes: string[]; colors: string[]; tags: ProductTagType[]; audiences: Audience[] };
}) {
  // Solo etiquetas que alguna prenda tiene (más las activas, para poder quitarlas).
  const visibleTagOptions = TAG_OPTIONS.filter(([value]) => options.tags.includes(value) || active.etiqueta.includes(value));

  // Si la sección ya es de un solo género (p. ej. Damas), filtrar por público
  // es redundante. Se conserva solo si hay varios públicos o uno ya activo.
  const showAudience = options.audiences.length > 1;

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

      {showAudience && (
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
      )}

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

      <details className="group border border-line bg-paper" open={active.color.length > 0}>
        <summary className="focus-ring flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-3 text-sm font-semibold text-ink">
          <span>Color</span>
          <span className="flex items-center gap-2 text-xs font-medium text-ink-soft">
            {active.color[0] ?? "Todos los colores"}
            <span aria-hidden="true" className="text-base leading-none transition-transform group-open:rotate-45">+</span>
          </span>
        </summary>
        <div className="border-t border-line p-3" aria-label="Elegir color">
          <div className="flex flex-wrap gap-2">
            <CatalogColorFilterOption color="" selected={!active.color[0]} label="Todos" />
            {options.colors.map((color) => (
              <CatalogColorFilterOption key={color} color={color} selected={active.color[0] === color} label={color} />
            ))}
          </div>
        </div>
      </details>

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
    : { backgroundColor: "#ffffff", borderColor: "#59636a", color: "#101417" };

  return (
    <label
      title={label}
      className={`focus-ring-within flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border transition-[border-color,box-shadow,filter] hover:brightness-95 ${
        selected ? "ring-2 ring-ink ring-offset-2" : ""
      }`}
      style={style}
    >
      <input type="radio" name="color" value={color} defaultChecked={selected} className="sr-only" aria-label={label} />
      <span className="sr-only">{label}</span>
    </label>
  );
}
