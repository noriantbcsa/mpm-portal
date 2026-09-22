import { describe, expect, it } from "vitest";

import { toSlug, uniqueSlug } from "@/lib/slug";

describe("toSlug", () => {
  it("lowercases, strips accents and punctuation", () => {
    expect(toSlug("Camisón Cola de Pato (Nuevo)")).toBe("camison-cola-de-pato-nuevo");
  });

  it("returns an empty string for blank input (uniqueSlug applies the 'item' fallback)", () => {
    expect(toSlug("   ")).toBe("");
  });
});

describe("uniqueSlug", () => {
  it("returns the base slug when it is not taken", async () => {
    const slug = await uniqueSlug("Vestido Midi", async () => false);
    expect(slug).toBe("vestido-midi");
  });

  it("falls back to 'item' when the name has no usable characters", async () => {
    const slug = await uniqueSlug("   ", async () => false);
    expect(slug).toBe("item");
  });

  it("appends an incrementing suffix until it finds a free slug", async () => {
    const taken = new Set(["vestido-midi", "vestido-midi-2", "vestido-midi-3"]);
    const slug = await uniqueSlug("Vestido Midi", async (candidate) => taken.has(candidate));
    expect(slug).toBe("vestido-midi-4");
  });
});
