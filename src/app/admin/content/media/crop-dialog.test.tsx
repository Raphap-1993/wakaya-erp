import { describe, expect, it } from "vitest";

import {
  getCropDialogInteractionState,
  isCropDialogReady,
  requiredVariants,
} from "./crop-dialog";

describe("CropDialog", () => {
  it("requires desktop and mobile crops for hero assets", () => {
    expect(requiredVariants("hero")).toEqual(["desktop", "mobile"]);
    expect(
      isCropDialogReady({
        slot: "hero",
        activeVariant: "desktop",
        areas: {
          desktop: { x: 0, y: 0, width: 800, height: 450 },
        },
        saved: {},
      }),
    ).toBe(false);

    expect(
      isCropDialogReady({
        slot: "hero",
        activeVariant: "mobile",
        areas: {
          mobile: { x: 0, y: 0, width: 640, height: 800 },
        },
        saved: {
          desktop: { x: 0, y: 0, width: 0.8, height: 0.56, rotation: 0 },
        },
      }),
    ).toBe(true);
  });

  it("requires a single standard crop for gallery-like assets", () => {
    expect(requiredVariants("gallery")).toEqual(["standard"]);
    expect(
      isCropDialogReady({
        slot: "gallery",
        activeVariant: "standard",
        areas: {},
        saved: {},
      }),
    ).toBe(false);

    expect(
      isCropDialogReady({
        slot: "gallery",
        activeVariant: "standard",
        areas: {
          standard: { x: 0, y: 0, width: 900, height: 675 },
        },
        saved: {},
      }),
    ).toBe(true);
  });

  it("locks every interrupting action while processing", () => {
    expect(getCropDialogInteractionState(true)).toEqual({
      applyLabel: "Procesando…",
      applyDisabled: true,
      cancelDisabled: true,
      tabsDisabled: true,
      closeAllowed: false,
    });
  });
});
