import type { Metadata } from "next";

import { getSiteSettings } from "@/lib/site-config";
import { CartPageClient } from "@/components/cart/cart-page-client";

export const metadata: Metadata = {
  title: "Carrito de pedido",
  description: "Revisa tu selección y envía tu solicitud comercial a MPM, sin pagos en línea.",
  robots: { index: false },
};

// Sin esto, Next detecta que esta página no usa ninguna API de request y la
// congela como HTML estático en el build: un cambio en "Mostrar precios"
// desde /admin/ajustes no se reflejaría hasta el próximo despliegue.
export const dynamic = "force-dynamic";

export default async function CarritoPage() {
  const settings = await getSiteSettings();
  return <CartPageClient showPrices={settings.showPrices} />;
}
