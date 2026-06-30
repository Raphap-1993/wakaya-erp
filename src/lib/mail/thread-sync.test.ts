import { describe, expect, it } from "vitest";

import { dedupeProviderMessages } from "@/lib/mail/thread-sync";

describe("thread sync", () => {
  it("deduplicates inbound provider messages by provider id", () => {
    const messages = dedupeProviderMessages([
      { providerMessageId: "m1" },
      { providerMessageId: "m1" },
      { providerMessageId: "m2" },
    ]);

    expect(messages).toHaveLength(2);
  });
});
