import { describe, expect, it, vi } from "vitest";

import { connectOrSkip } from "./integration/test-db";

describe("connectOrSkip", () => {
  it("omite integración cuando la consulta de comprobación no llega a la base", async () => {
    const prisma = {
      $connect: vi.fn().mockResolvedValue(undefined),
      $queryRaw: vi.fn().mockRejectedValue(new Error("connect EPERM 127.0.0.1:5544")),
    };

    const previousCi = process.env.CI;
    delete process.env.CI;
    try {
      await expect(connectOrSkip(prisma)).resolves.toBe(false);
      expect(prisma.$connect).toHaveBeenCalledOnce();
      expect(prisma.$queryRaw).toHaveBeenCalledOnce();
    } finally {
      if (previousCi === undefined) delete process.env.CI;
      else process.env.CI = previousCi;
    }
  });

  it("confirma la disponibilidad solo después de una consulta satisfactoria", async () => {
    const prisma = {
      $connect: vi.fn().mockResolvedValue(undefined),
      $queryRaw: vi.fn().mockResolvedValue([{ ok: 1 }]),
    };

    await expect(connectOrSkip(prisma)).resolves.toBe(true);
  });

  it("propaga una conexión fallida en CI para no ocultar una configuración rota", async () => {
    const failure = new Error("connect ECONNREFUSED 127.0.0.1:5432");
    const prisma = {
      $connect: vi.fn().mockRejectedValue(failure),
      $queryRaw: vi.fn(),
    };

    const previousCi = process.env.CI;
    process.env.CI = "true";
    try {
      await expect(connectOrSkip(prisma)).rejects.toBe(failure);
      expect(prisma.$queryRaw).not.toHaveBeenCalled();
    } finally {
      if (previousCi === undefined) delete process.env.CI;
      else process.env.CI = previousCi;
    }
  });
});
