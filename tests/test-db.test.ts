import { describe, expect, it, vi } from "vitest";

import { connectOrSkip } from "./integration/test-db";

describe("connectOrSkip", () => {
  it("omite integración cuando la consulta de comprobación no llega a la base", async () => {
    const prisma = {
      $connect: vi.fn().mockResolvedValue(undefined),
      $queryRaw: vi.fn().mockRejectedValue(new Error("connect EPERM 127.0.0.1:5544")),
    };

    await expect(connectOrSkip(prisma)).resolves.toBe(false);
    expect(prisma.$connect).toHaveBeenCalledOnce();
    expect(prisma.$queryRaw).toHaveBeenCalledOnce();
  });

  it("confirma la disponibilidad solo después de una consulta satisfactoria", async () => {
    const prisma = {
      $connect: vi.fn().mockResolvedValue(undefined),
      $queryRaw: vi.fn().mockResolvedValue([{ ok: 1 }]),
    };

    await expect(connectOrSkip(prisma)).resolves.toBe(true);
  });
});
