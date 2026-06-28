import { describe, expect, it } from "vitest";
import { metadata } from "./layout";

describe("RootLayout metadata", () => {
  it("uses the Wakaya brand and the split product description", () => {
    expect(metadata.title).toBe("Wakaya");
    expect(metadata.description).toBe("Wakaya hospitality site and reservations monitor");
  });
});
