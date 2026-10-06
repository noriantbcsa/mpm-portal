import "server-only";

import { headers } from "next/headers";

type RateLimit = {
  limit: number;
  windowMs: number;
};

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10_000;

/**
 * Límite de frecuencia local para las acciones públicas. Es una primera capa
 * contra abuso; en producción debe complementarse con rate limiting/WAF del
 * proveedor, ya que la memoria no se comparte entre instancias.
 */
export function consumeRateLimit(key: string, { limit, windowMs }: RateLimit) {
  const now = Date.now();

  if (buckets.size >= MAX_BUCKETS) {
    for (const [bucketKey, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(bucketKey);
    }
    // Evita que claves aleatorias conviertan el rate limiter en un consumo de
    // memoria no acotado. Perder límites antiguos es preferible a degradar el
    // proceso completo.
    if (buckets.size >= MAX_BUCKETS) buckets.clear();
  }

  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  current.count += 1;
  return {
    allowed: current.count <= limit,
    retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
  };
}

/**
 * Identificador de origen para límites de frecuencia, sin guardar PII.
 *
 * Se prefiere `CF-Connecting-IP`, que Cloudflare (delante de Render) siempre
 * sobrescribe con la IP real. `True-Client-IP` solo lo fija Cloudflare en
 * algunos planes, así que no se usa: si el borde no lo pisa, el cliente
 * podría elegir su propio contador. El primer valor de `X-Forwarded-For` lo
 * controla el cliente; solo es el último recurso (p. ej. desarrollo local).
 */
export async function getRequestRateLimitKey() {
  const requestHeaders = await headers();
  const trusted = requestHeaders.get("cf-connecting-ip") ?? requestHeaders.get("x-real-ip");
  const forwarded = requestHeaders.get("x-forwarded-for")?.split(",")[0];
  return (trusted ?? forwarded)?.trim() || "unknown";
}
