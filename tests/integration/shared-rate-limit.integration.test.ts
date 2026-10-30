import { connectOrSkip } from "./test-db";
import { createHash, randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";

import { prisma } from "@/lib/prisma";
import { consumeSharedRateLimit } from "@/lib/security/shared-rate-limit";

const available = await connectOrSkip(prisma);
const key = `login-integration:${randomUUID()}`;
const hash = createHash("sha256").update(key).digest("hex");

afterAll(async () => {
  if (available) await prisma.rateLimitBucket.deleteMany({ where: { key: hash } });
  await prisma.$disconnect();
});

describe.skipIf(!available)("límite compartido con PostgreSQL real", () => {
  it("cuenta intentos concurrentes y reinicia solo al vencer la ventana", async () => {
    const results = await Promise.all(
      Array.from({ length: 5 }, () => consumeSharedRateLimit(key, { limit: 3, windowMs: 60_000 })),
    );
    expect(results.filter((result) => result.allowed)).toHaveLength(3);
    expect(results.filter((result) => !result.allowed)).toHaveLength(2);
    expect((await prisma.rateLimitBucket.findUniqueOrThrow({ where: { key: hash } })).count).toBe(4);

    await prisma.rateLimitBucket.update({ where: { key: hash }, data: { resetAt: new Date(0) } });
    expect(await consumeSharedRateLimit(key, { limit: 3, windowMs: 60_000 })).toMatchObject({
      allowed: true,
      retryAfterSeconds: 0,
    });
    expect((await prisma.rateLimitBucket.findUniqueOrThrow({ where: { key: hash } })).count).toBe(1);
  });
});
