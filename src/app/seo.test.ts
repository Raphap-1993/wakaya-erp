import { describe, expect, it } from "vitest";

import robots from "./robots";
import sitemap from "./sitemap";

describe("SEO routes", () => {
  it("publishes robots rules for public locales and blocks prototype/admin surfaces", () => {
    const result = robots();

    expect(result).toMatchObject({
      host: "https://wakayaecolodge.com",
      sitemap: "https://wakayaecolodge.com/sitemap.xml",
    });
    expect(result.rules).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          allow: ["/es", "/en"],
          disallow: ["/admin/", "/api/", "/prototype/public-site"],
        }),
      ]),
    );
  });

  it("publishes bilingual public URLs in the sitemap", () => {
    const result = sitemap();
    const urls = result.map((entry) => entry.url);

    expect(urls).toContain("https://wakayaecolodge.com/es");
    expect(urls).toContain("https://wakayaecolodge.com/en");
    expect(urls).toContain("https://wakayaecolodge.com/es/contact");
    expect(urls).toContain("https://wakayaecolodge.com/en/contact");
    expect(urls).toContain("https://wakayaecolodge.com/es/bungalows/bungalow-familiar");
    expect(urls).toContain("https://wakayaecolodge.com/en/bungalows/bungalow-familiar");
  });
});
