import { describe, expect, it } from "vitest";

import { buildInitialTransferEmail } from "@/lib/mail/email-outbox";

describe("initial transfer email", () => {
  it("uses reservas@wakayaecolodge.com as reply context", () => {
    const email = buildInitialTransferEmail({
      guestName: "Ada Lovelace",
      guestEmail: "ada@example.com",
      publicRef: "WR-2026-0001",
      requestedCheckIn: "2026-07-10",
      requestedCheckOut: "2026-07-12",
    });

    expect(email.to).toEqual(["ada@example.com"]);
    expect(email.replyTo).toBe("reservas@wakayaecolodge.com");
    expect(email.subject).toContain("WR-2026-0001");
  });
});
