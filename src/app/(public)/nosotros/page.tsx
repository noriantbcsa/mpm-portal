import type { Metadata } from "next";
import { Factory, Scissors, Send, Store, type LucideIcon } from "lucide-react";

import { getSiteSettings } from "@/lib/site-config";
import { buildWhatsAppLink } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Nosotros",
  description: "Conoce la historia, el trabajo y los valores de MPM Moda.",
};

export const dynamic = "force-dynamic";

type TimelineStep = { period: string; title: string; description: string; icon: LucideIcon };

const timeline: TimelineStep[] = [
  { period: "2017", title: "Un sueño en el Madrugón", description: "MPM comenzó distribuyendo prendas según las necesidades del mercado en el centro de Bogotá.", icon: Store },
  { period: "El siguiente paso", title: "De distribuir a confeccionar", description: "La experiencia del sector impulsó el paso a la fabricación propia, empezando con blusones de dama en doce tonos.", icon: Scissors },
  { period: "Hoy", title: "Moda para ella y para él", description: "Ampliamos las líneas de confección con variedad de colores y tallas para atender cada referencia con cercanía.", icon: Factory },
  { period: "Siempre", title: "Bogotá para todo el país", description: "Desde nuestra tienda física en Bogotá acompañamos pedidos con envíos nacionales seguros y atención personalizada.", icon: Send },
];

const values = ["Calidad", "Pasión", "Dedicación", "Cumplimiento"];

export default async function NosotrosPage() {
  const settings = await getSiteSettings();
  const whatsappHref = buildWhatsAppLink(settings.whatsappNumber, settings.whatsappDefaultMessage);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <section className="seasonal-glass grid gap-8 border-b border-line p-6 sm:p-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)] lg:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-primary">Desde 2017 · Bogotá</p>
          <h1 className="mt-3 max-w-3xl font-display text-4xl font-semibold tracking-[-0.05em] text-ink sm:text-5xl">Moda hecha con oficio, constancia y cercanía.</h1>
        </div>
        <p className="max-w-xl text-base leading-7 text-ink-soft">{settings.siteName} nació con la intención de construir una marca propia y crecer con cada prenda, cada pedido y cada relación de confianza.</p>
      </section>

      <section className="seasonal-glass p-6 sm:p-8">
        <div className="mb-8 max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-ink-soft">Nuestra historia</p>
          <h2 className="mt-2 font-display text-3xl font-semibold tracking-[-0.04em] text-ink sm:text-4xl">Un recorrido que sigue en movimiento</h2>
        </div>
        <ol className="grid gap-4 md:grid-cols-2">
          {timeline.map(({ period, title, description, icon: Icon }) => (
            <li key={title} className="border border-line bg-paper p-6 sm:p-7">
              <div className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-primary text-white"><Icon className="h-5 w-5" aria-hidden="true" /></span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-primary">{period}</p>
                  <h3 className="mt-1 text-lg font-semibold text-ink">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-ink-soft">{description}</p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="seasonal-glass grid gap-8 border-y border-line p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.9fr)]">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-ink-soft">Nuestra línea de trabajo</p>
          <h2 className="mt-2 font-display text-3xl font-semibold tracking-[-0.04em] text-ink sm:text-4xl">Confección que acompaña cada necesidad</h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-ink-soft">Diseñamos y fabricamos ropa femenina y masculina en una amplia variedad de tallas y colores. Cuidamos los materiales, los detalles de confección y la asesoría antes de confirmar cada pedido.</p>
        </div>
        <div className="grid grid-cols-2 gap-px bg-line">
          {values.map((value) => (
            <div key={value} className="bg-brand-accent/35 p-5 sm:p-6">
              <p className="font-display text-xl font-semibold text-ink">{value}</p>
              <p className="mt-2 text-sm leading-6 text-ink-soft">{value === "Calidad" && "Materiales y acabados que responden a altos estándares."}{value === "Pasión" && "Energía puesta desde el diseño hasta la atención."}{value === "Dedicación" && "Esmero en cada detalle y en cada referencia."}{value === "Cumplimiento" && "Compromisos claros, atención oportuna y confianza."}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="seasonal-glass p-6 text-center sm:p-8">
        <h2 className="font-display text-3xl font-semibold tracking-[-0.04em] text-ink">Hablemos de tu próximo pedido</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-ink-soft">Escríbenos para resolver dudas sobre referencias, pedidos por volumen o dotación empresarial.</p>
        <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="focus-ring mt-6 inline-flex min-h-10 items-center justify-center rounded-full bg-[#25D366] px-6 py-3 text-base font-semibold text-[#0b3d24] hover:brightness-95">Escribir por WhatsApp</a>
      </section>
    </div>
  );
}
