import { describe, expect, it } from "vitest";

import { computeTooltipLayout } from "./info-tooltip";

describe("computeTooltipLayout", () => {
  it("clamps the bubble inside the viewport when the trigger sits near the left edge", () => {
    const layout = computeTooltipLayout(
      {
        left: 10,
        top: 240,
        width: 20,
        height: 20,
      },
      { width: 280, height: 88 },
      { width: 390, height: 820 },
    );

    expect(layout.left).toBe(12);
    expect(layout.placement).toBe("top");
  });

  it("moves the bubble below the trigger when there is not enough room above", () => {
    const layout = computeTooltipLayout(
      {
        left: 180,
        top: 6,
        width: 20,
        height: 20,
      },
      { width: 260, height: 88 },
      { width: 390, height: 820 },
    );

    expect(layout.placement).toBe("bottom");
    expect(layout.top).toBeGreaterThan(20);
  });

  it("keeps the tooltip compact on large screens instead of spanning the whole card", () => {
    const layout = computeTooltipLayout(
      {
        left: 420,
        top: 240,
        width: 20,
        height: 20,
      },
      { width: 920, height: 88 },
      { width: 1440, height: 900 },
    );

    expect(layout.maxWidth).toBe(420);
    expect(layout.left).toBeGreaterThan(200);
  });
});
