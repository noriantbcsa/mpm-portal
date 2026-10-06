import { NotFoundContent } from "@/components/layout/not-found-content";

// 404 global (URL que no coincide con ninguna ruta): sin el diseño del sitio.
export default function NotFound() {
  return <NotFoundContent fullScreen />;
}
