import { describe, expect, it } from "vitest";

import * as adminLayoutModule from "./layout";

describe("AdminLayout", () => {
  it("forces dynamic rendering across the backoffice shell", () => {
    expect(adminLayoutModule.dynamic).toBe("force-dynamic");
  });
});
