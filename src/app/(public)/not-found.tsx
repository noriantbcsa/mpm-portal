import { NotFoundContent } from "@/components/layout/not-found-content";

// 404 dentro del sitio (producto, categoría o campaña inexistente/oculta):
// conserva cabecera, pie, enlace de salto y <main> del layout público.
export default function PublicNotFound() {
  return <NotFoundContent />;
}
