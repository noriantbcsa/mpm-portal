import { readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import photoColors from "@/lib/catalog-photo-colors.json";
import { catalogImagesForColor, getCatalogColorSwatch, uniqueCatalogColors } from "@/lib/catalog-colors";

const publicRoot = join(process.cwd(), "public");
function files(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? files(join(dir, entry.name)) : [join(dir, entry.name)]);
}
const photos = files(join(publicRoot, "catalogo")).map((file) =>
  `/${relative(publicRoot, file).split("/").map(encodeURIComponent).join("/")}`);

describe("auditoría de las fotos originales", () => {
  it("las etiquetas se leen sobre todas las muestras de color del catálogo", () => {
    function luminance(hex: string) {
      const rgb = hex.slice(1).match(/../g)!.map((value) => parseInt(value, 16) / 255)
        .map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
      return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
    }
    for (const color of new Set(Object.values(photoColors))) {
      const swatch = getCatalogColorSwatch(color)!;
      const light = Math.max(luminance(swatch.background), luminance(swatch.foreground));
      const dark = Math.min(luminance(swatch.background), luminance(swatch.foreground));
      expect.soft((light + 0.05) / (dark + 0.05), color).toBeGreaterThanOrEqual(4.5);
    }
  });
  it("todas las 360 fotos tienen color y ninguna asignación apunta a un archivo inexistente", () => {
    expect(photos).toHaveLength(360);
    expect(Object.keys(photoColors).sort()).toEqual([...photos].sort());
    for (const [url, color] of Object.entries(photoColors)) {
      expect(getCatalogColorSwatch(color), url).not.toBeNull();
    }
  });

  it("cada opción de las 18 prendas recupera solamente sus fotos y permite alcanzar las 360", () => {
    const groups = new Map<string, { url: string; color: string }[]>();
    for (const [url, color] of Object.entries(photoColors)) {
      const folder = url.slice(0, url.lastIndexOf("/"));
      groups.set(folder, [...(groups.get(folder) ?? []), { url, color }]);
    }
    expect(groups.size).toBe(18);
    let reached = 0;
    for (const images of groups.values()) {
      const urls = new Set<string>();
      for (const color of uniqueCatalogColors(images.map((image) => image.color))) {
        const selected = catalogImagesForColor(images, color);
        expect(selected.length).toBeGreaterThan(0);
        expect(selected.every((image) => image.color === color)).toBe(true);
        selected.forEach((image) => urls.add(image.url));
      }
      expect(urls.size).toBe(images.length);
      reached += urls.size;
    }
    expect(reached).toBe(360);
  });
});
