import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

/**
 * Banner del modo normal (sin festividad activa): negro de marca con acento lima
 * para que el sitio nunca se vea apagado entre celebraciones.
 */
export function NormalModeBanner({ siteName }: { siteName: string }) {
  return (
    <aside className="normal-banner" aria-label={`Colección ${siteName}`}>
      <div className="normal-banner-inner">
        <div className="normal-banner-text">
          <p className="normal-banner-eyebrow">Nueva colección · Al detal y al por mayor</p>
          <p className="normal-banner-title">Moda que se nota</p>
        </div>
        <Link href="/catalogo" className="normal-banner-cta focus-ring">
          Ver catálogo <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      </div>
    </aside>
  );
}
