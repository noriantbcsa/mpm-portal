import { describe, expect, it } from "vitest";

import { normalizeSizes } from "@/lib/sizes";

describe("normalizeSizes", () => {
  it("uppercases letter sizes, trims and removes duplicates", () => {
    expect(normalizeSizes([" xl ", "XL", "m", "Xs", "xxl"])).toEqual(["XL", "M", "XS", "XXL"]);
  });

  it("keeps other sizes as written and drops empty ones", () => {
    expect(normalizeSizes(["Talla  única", "38", "", "  "])).toEqual(["Talla única", "38"]);
  });

  it("is case-insensitive when deduplicating non-letter sizes", () => {
    expect(normalizeSizes(["Talla única", "talla única"])).toEqual(["Talla única"]);
  });
});
