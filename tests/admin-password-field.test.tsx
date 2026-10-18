import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AdminTextField } from "@/components/admin/ui/controls";
import { ProductPicker } from "@/components/admin/product-picker";

describe("campo de contraseña del admin", () => {
  it("las contraseñas llevan botón de ojo y empiezan ocultas", () => {
    const html = renderToStaticMarkup(<AdminTextField label="Contraseña" name="password" type="password" />);
    expect(html).toContain('type="password"');
    expect(html).toContain('aria-label="Mostrar contraseña"');
  });

  it("los demás campos no llevan ojo", () => {
    const html = renderToStaticMarkup(<AdminTextField label="Correo" name="email" type="email" />);
    expect(html).not.toContain("contraseña");
  });
});

describe("selector de referencias de campaña", () => {
  it("muestra el contador y conserva todas las casillas del formulario", () => {
    const options = [
      { id: "a", sku: "A-1", name: "Camisa", campaign: null },
      { id: "b", sku: "B-1", name: "Blusa", campaign: { id: "c2", name: "Otra" } },
    ];
    const html = renderToStaticMarkup(<ProductPicker options={options} selectedIds={["a"]} />);
    expect(html).toContain("1 referencia elegida de 2");
    expect(html.match(/name="productIds"/g)).toHaveLength(2);
    expect(html).toContain("ahora en «Otra»");
  });
});
