import type { Metadata } from "next";

import { buildDefaultPolicy, DATA_POLICY_UPDATED_AT, isCustomPolicyText } from "@/lib/data-policy";
import { getSiteSettings } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Política de tratamiento de datos personales",
  description: "Cómo MPM recolecta, usa y protege los datos personales de sus clientes.",
  alternates: { canonical: "/politica-de-datos" },
};

// El texto se edita desde /admin/ajustes; sin esto quedaría congelado en el
// HTML del build hasta el próximo despliegue.
export const dynamic = "force-dynamic";

export default async function PoliticaDeDatosPage() {
  const settings = await getSiteSettings();
  // Un texto propio guardado en /admin/ajustes manda; el marcador "Texto
  // provisional" que sembraban versiones anteriores cuenta como vacío.
  const customText = isCustomPolicyText(settings.dataPolicyText) ? settings.dataPolicyText.trim() : null;
  const sections = customText ? null : buildDefaultPolicy(settings);

  return (
    <div className="seasonal-glass mx-auto my-6 max-w-2xl px-4 py-12 sm:px-8">
      <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
        Política de tratamiento de datos personales
      </h1>
      {customText ? (
        <div className="mt-6 whitespace-pre-line text-sm leading-relaxed text-ink-soft">{customText}</div>
      ) : (
        <div className="mt-6 flex flex-col gap-6 text-sm leading-relaxed text-ink-soft">
          <p>Última actualización: {DATA_POLICY_UPDATED_AT}.</p>
          {sections?.map((section) => (
            <section key={section.title} className="flex flex-col gap-2">
              <h2 className="font-display text-base font-semibold text-ink">{section.title}</h2>
              {section.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              {section.items && section.items.length > 0 && (
                <ul className="list-disc space-y-1 pl-5">
                  {section.items.map((item) => <li key={item}>{item}</li>)}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
