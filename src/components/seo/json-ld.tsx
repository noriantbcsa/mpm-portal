import { headers } from "next/headers";

export async function JsonLd({ data }: { data: Record<string, unknown> }) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  // JSON.stringify no escapa el cierre de una etiqueta script. Si un dato
  // editable contiene </script>, escaparlo conserva JSON válido y evita XSS.
  const json = JSON.stringify(data).replace(/</g, "\\u003c");

  return (
    <script
      type="application/ld+json"
      nonce={nonce}
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
