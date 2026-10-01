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

/** Identificador de origen para límites de frecuencia, sin guardar PII. */
export async function getRequestRateLimitKey() {
  const requestHeaders = await headers();
  const forwarded = requestHeaders.get("x-forwarded-for");
  const clientIp = forwarded?.split(",")[0]?.trim() || requestHeaders.get("x-real-ip");
  return clientIp || "unknown";
}
