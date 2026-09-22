import { describe, expect, it } from "vitest";

import { formatPrice, onlyDigits, formatRelativeDays } from "@/lib/format";

describe("formatPrice", () => {
  it("formats a number as Colombian pesos without decimals", () => {
    expect(formatPrice(45000)).toBe("$ 45.000");
  });

  it("accepts numeric strings", () => {
    expect(formatPrice("39900")).toBe("$ 39.900");
  });

  it("returns null for null, undefined or non-numeric input", () => {
    expect(formatPrice(null)).toBeNull();
    expect(formatPrice(undefined)).toBeNull();
    expect(formatPrice("no-es-un-numero")).toBeNull();
  });
});

describe("onlyDigits", () => {
  it("keeps only digit characters", () => {
    expect(onlyDigits("+57 (300) 123-4567")).toBe("573001234567");
  });
});

describe("formatRelativeDays", () => {
  it("says 'hoy' for the current moment", () => {
    expect(formatRelativeDays(new Date())).toBe("hoy");
  });

  it("says 'hace 1 día' for yesterday", () => {
    const yesterday = new Date(Date.now() - 25 * 60 * 60 * 1000);
    expect(formatRelativeDays(yesterday)).toBe("hace 1 día");
  });

  it("pluralizes for multiple days", () => {
    const ninedaysAgo = new Date(Date.now() - 9 * 24 * 60 * 60 * 1000);
    expect(formatRelativeDays(ninedaysAgo)).toBe("hace 9 días");
  });
});
