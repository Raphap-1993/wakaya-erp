import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import HomePage from "./page";

describe("HomePage", () => {
  it("renders a launcher to the public site and internal monitor", () => {
    const html = renderToStaticMarkup(<HomePage />);

    expect(html).toContain("/prototype/public-site");
    expect(html).toContain("/admin/reservations");
    expect(html).toContain("Wakaya");
  });
});
