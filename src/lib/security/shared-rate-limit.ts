import "server-only";

import { createHash } from "node:crypto";

import { prisma } from "@/lib/prisma";

type RateLimit = { limit: number; windowMs: number };
type BucketRow = { count: number; resetAt: Date };

/** Límite atómico y compartido para el acceso, sin guardar IP ni correo en claro. */
export async function consumeSharedRateLimit(key: string, { limit, windowMs }: RateLimit) {
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowMs);
  const hash = createHash("sha256").update(key).digest("hex");
  const [bucket] = await prisma.$queryRaw<BucketRow[]>`
    INSERT INTO "RateLimitBucket" ("key", "count", "resetAt")
    VALUES (${hash}, 1, ${resetAt})
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE
        WHEN "RateLimitBucket"."resetAt" <= ${now} THEN 1
        ELSE LEAST("RateLimitBucket"."count" + 1, ${limit + 1})
      END,
      "resetAt" = CASE
        WHEN "RateLimitBucket"."resetAt" <= ${now} THEN ${resetAt}
        ELSE "RateLimitBucket"."resetAt"
      END
    RETURNING "count", "resetAt"
  `;

  // Quitar periódicamente contadores vencidos sin añadir trabajo a cada login.
  if (Math.random() < 0.01) {
    await prisma.rateLimitBucket.deleteMany({ where: { resetAt: { lt: now } } });
  }

  return {
    allowed: bucket.count <= limit,
    retryAfterSeconds: bucket.count <= limit
      ? 0
      : Math.max(1, Math.ceil((bucket.resetAt.getTime() - now.getTime()) / 1000)),
  };
}
