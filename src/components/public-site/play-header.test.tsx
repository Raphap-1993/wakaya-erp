import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { PlayHeader } from "./play-header";

describe("PlayHeader", () => {
  it("renders hash navigation links for the public prototype", () => {
    const html = renderToStaticMarkup(<PlayHeader />);

    expect(html).toContain('href="#home"');
    expect(html).toContain('href="#booking"');
    expect(html).toContain("Consultar");
  });
});
