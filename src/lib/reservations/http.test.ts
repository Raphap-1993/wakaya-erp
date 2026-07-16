import { describe, expect, it } from "vitest";

import { mapApiError } from "./http";

describe("mapApiError persistence failures", () => {
  it("does not misclassify an unscoped missing relation as a media failure", () => {
    const error = Object.assign(new Error('relation "reservation" does not exist'), {
      code: "42P01",
    });

    expect(mapApiError(error).body.error).not.toBe("media_persistence_failed");
  });

  it("maps the canonical media persistence error to the media contract", () => {
    const error = Object.assign(
      new Error("media_persistence_failed", {
        cause: new Error('relation "media_asset" does not exist'),
      }),
      { code: "42P01" },
    );

    expect(mapApiError(error)).toEqual({
      body: { error: "media_persistence_failed" },
      status: 503,
    });
  });
});
