import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

describe("corporate content release portability", () => {
  it("keeps every runtime source inside the versioned corporate-content module", () => {
    const source = readFileSync(new URL("./default-content.ts", import.meta.url), "utf8");

    expect(source).not.toContain("output/");

    for (const filename of ["aboutus.json", "faq.json", "terms.json", "testimonial.json"]) {
      expect(existsSync(new URL(`./legacy-sources/${filename}`, import.meta.url))).toBe(true);
      expect(source).toContain(`./legacy-sources/${filename}`);
    }
  });
});
