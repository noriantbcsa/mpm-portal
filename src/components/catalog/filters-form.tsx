import {
  AUDIENCE_LABELS,
  PRODUCT_TAG_LABELS,
  SUGGESTED_COLORS,
  SUGGESTED_SIZES,
} from "@/lib/constants";
import type { Audience, ProductTagType } from "@prisma/client";
import { Button, LinkButton } from "@/components/ui/button";

export type ActiveFilters = {
  q?: string;
  categoria?: string;
  publico?: Audience;
  talla: string[];
  color: string[];
  etiqueta: ProductTagType[];
  orden?: string;
};

const AUDIENCE_OPTIONS = Object.entries(AUDIENCE_LABELS) as [Audience, string][];
const TAG_OPTIONS = Object.entries(PRODUCT_TAG_LABELS) as [ProductTagType, string][];

export function FiltersForm({ active }: { active: ActiveFilters }) {
  return (
    <form
      method="GET"
      action={active.categoria ? `/catalogo/${active.categoria}` : "/catalogo"}
      className="flex flex-col gap-6 border border-line bg-paper p-4"
      aria-label="Filtros del catálogo"
    >
      {active.q && <input type="hidden" name="q" value={active.q} />}

      <fieldset>
        <legend className="text-sm font-semibold text-ink">Ordenar por</legend>
        <select
          name="orden"
          defaultValue={active.orden ?? "relevancia"}
          className="focus-ring mt-2 w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm"
        >
          <option value="relevancia">Más recientes</option>
          <option value="nombre-asc">Nombre (A-Z)</option>
        </select>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-semibold text-ink">Público</legend>
        <div className="mt-2 flex flex-col gap-1.5">
          <label className="flex items-center gap-2 text-sm text-ink-soft">
            <input type="radio" name="publico" value="" defaultChecked={!active.publico} />
            Todos
          </label>
          {AUDIENCE_OPTIONS.map(([value, label]) => (
            <label key={value} className="flex items-center gap-2 text-sm text-ink-soft">
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

      <fieldset>
        <legend className="text-sm font-semibold text-ink">Etiquetas</legend>
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1.5">
          {TAG_OPTIONS.map(([value, label]) => (
            <label key={value} className="flex items-center gap-2 text-sm text-ink-soft">
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

      <fieldset>
        <legend className="text-sm font-semibold text-ink">Talla</legend>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {SUGGESTED_SIZES.map((size) => (
            <label
              key={size}
              className="flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-xs text-ink-soft has-checked:border-brand-primary has-checked:bg-brand-primary/10 has-checked:text-brand-primary"
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
        <div className="mt-2 flex flex-wrap gap-1.5">
          {SUGGESTED_COLORS.map((color) => (
            <label
              key={color}
              className="flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-xs text-ink-soft has-checked:border-brand-primary has-checked:bg-brand-primary/10 has-checked:text-brand-primary"
            >
              <input
                type="checkbox"
                name="color"
                value={color}
                defaultChecked={active.color.includes(color)}
                className="sr-only"
              />
              {color}
            </label>
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
