"use client";

import { useMemo, useState } from "react";

import { AdminButton } from "@/components/admin/ui/controls";

type Option = { id: string; sku: string; name: string; campaign: { id: string; name: string } | null };

/**
 * Selector de referencias con búsqueda y contador. Todas las casillas siguen en
 * el formulario (las filtradas solo se ocultan), así que lo marcado se guarda
 * aunque no esté visible.
 */
export function ProductPicker({
  options,
  selectedIds,
  currentCampaignId,
}: {
  options: Option[];
  selectedIds: string[];
  currentCampaignId?: string;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(() => new Set(selectedIds));

  const needle = query.trim().toLowerCase();
  const visibleIds = useMemo(
    () =>
      new Set(
        options
          .filter((option) => !needle || `${option.sku} ${option.name}`.toLowerCase().includes(needle))
          .map((option) => option.id),
      ),
    [options, needle],
  );

  function toggle(id: string, checked: boolean) {
    setSelected((current) => {
      const next = new Set(current);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function setVisible(checked: boolean) {
    setSelected((current) => {
      const next = new Set(current);
      for (const id of visibleIds) {
        if (checked) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  }

  return (
    <div className="mt-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Buscar referencias"
          placeholder="Buscar por nombre o referencia…"
          className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
        />
        <AdminButton type="button" variant="secondary" size="sm" onClick={() => setVisible(true)}>
          Marcar las {visibleIds.size} visibles
        </AdminButton>
        <AdminButton type="button" variant="ghost" size="sm" onClick={() => setVisible(false)}>
          Quitar visibles
        </AdminButton>
      </div>
      <p className="mt-2 text-xs font-medium text-slate-600" aria-live="polite">
        {selected.size} {selected.size === 1 ? "referencia elegida" : "referencias elegidas"} de {options.length}
      </p>
      <div className="mt-2 grid max-h-80 gap-2 overflow-y-auto rounded-md border border-slate-200 p-3 sm:grid-cols-2">
        {options.map((option) => {
          const elsewhere = option.campaign && option.campaign.id !== currentCampaignId ? option.campaign.name : null;
          return (
            <label
              key={option.id}
              className={`${visibleIds.has(option.id) ? "flex" : "hidden"} items-center gap-2 text-sm text-slate-700`}
              hidden={!visibleIds.has(option.id)}
            >
              <input
                type="checkbox"
                name="productIds"
                value={option.id}
                checked={selected.has(option.id)}
                onChange={(event) => toggle(option.id, event.target.checked)}
                className="h-4 w-4 rounded border-slate-300"
              />
              <span>
                {option.sku} · {option.name}
                {elsewhere && <span className="text-amber-700"> (ahora en «{elsewhere}»; pasará a esta)</span>}
              </span>
            </label>
          );
        })}
        {visibleIds.size === 0 && <p className="text-sm text-slate-500 sm:col-span-2">Ninguna referencia coincide.</p>}
      </div>
    </div>
  );
}
