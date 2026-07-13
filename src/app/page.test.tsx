import { describe, expect, it } from "vitest";

import HomePage from "./page";

describe("HomePage", () => {
  it("redirects the public root to the default locale", () => {
    try {
      HomePage();
      throw new Error("expected redirect");
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error & { digest?: string }).digest).toBe("NEXT_REDIRECT;replace;/es;307;");
    }
  });
});
