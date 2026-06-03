import { readFileSync } from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { PlayHeader } from "./play-header";

describe("PlayHeader", () => {
  it("does not depend on next/link for hash navigation", () => {
    const source = readFileSync(path.join(process.cwd(), "src/components/public-site/play-header.tsx"), "utf8");

    expect(source).not.toMatch(/from\s+["']next\/link["']/);
  });

  it("renders hash navigation links for the public prototype", () => {
    const html = renderToStaticMarkup(<PlayHeader />);

    expect(html).toContain('href="#home"');
    expect(html).toContain('href="#booking"');
    expect(html).toContain("Consultar");
  });
});
