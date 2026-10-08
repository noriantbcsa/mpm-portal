import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { SeasonalBackdrop } from "@/components/layout/seasonal-backdrop";
import manifest from "@/lib/seasonal-art-manifest.json";
import type { SeasonalTheme } from "@/lib/seasonal-themes";

const opposite = { left: "right", right: "left" } as const;

describe("SeasonalBackdrop", () => {
  it("alterna izquierda–derecha–izquierda en todas las festividades (reflejando lo necesario)", () => {
    for (const [name, entry] of Object.entries(manifest) as [string, { arts: { side: "left" | "right" }[] }][]) {
      const html = renderToStaticMarkup(<SeasonalBackdrop theme={{ preset: name.toUpperCase().replaceAll("-", "_") } as unknown as SeasonalTheme} />);
      const layers = [...html.matchAll(/class="seasonal-art ([^"]*)"/g)].map((m) => m[1]);
      expect(layers, name).toHaveLength(3);
      const visual = layers.map((classes, i) => (classes.includes("seasonal-art--flip") ? opposite[entry.arts[i].side] : entry.arts[i].side));
      expect(visual, name).toEqual(["left", "right", "left"]);
    }
  });

  it("no pinta nada sin tema o con una festividad sin pinturas", () => {
    expect(renderToStaticMarkup(<SeasonalBackdrop theme={null} />)).toBe("");
    expect(renderToStaticMarkup(<SeasonalBackdrop theme={{ preset: "INEXISTENTE" } as unknown as SeasonalTheme} />)).toBe("");
  });
});
