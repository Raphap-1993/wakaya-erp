import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

function read(path: string) {
  return readFileSync(path, "utf8");
}

describe("shared media pipeline architecture", () => {
  it("keeps legacy wrappers delegating to shared content media utilities", () => {
    const homeMedia = read("src/lib/home-content/media.ts");
    const bungalowMedia = read("src/lib/reservations/bungalow-media.ts");

    expect(homeMedia).toContain('from "@/lib/content/media/image-optimizer"');
    expect(homeMedia).not.toContain('from "sharp"');
    expect(bungalowMedia).toContain('from "@/lib/content/media/image-optimizer"');
    expect(bungalowMedia).not.toContain('from "sharp"');
  });
});
