import { beforeEach, describe, expect, it, vi } from "vitest";

import { sendTransactionalEmail } from "@/lib/mail/resend-client";

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

describe("sendTransactionalEmail", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    delete process.env.RESEND_API_KEY;
  });

  it("returns queued_without_provider when resend is not configured", async () => {
    const result = await sendTransactionalEmail({
      to: ["ada@example.com"],
      subject: "Solicitud WR-2026-0001",
      html: "<p>Hola</p>",
      text: "Hola",
      replyTo: "reservas@wakayaecolodge.com",
      idempotencyKey: "booking-request:WR-2026-0001:initial-email",
      threadKey: "booking-request:WR-2026-0001",
    });

    expect(result).toEqual({
      status: "queued_without_provider",
      provider: "none",
      providerMessageId: null,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends attachments and threading metadata to Resend", async () => {
    process.env.RESEND_API_KEY = "re_test";
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ id: "email_123" }),
    });

    const result = await sendTransactionalEmail({
      to: ["ada@example.com"],
      subject: "Solicitud WR-2026-0001",
      html: "<p>Hola</p>",
      text: "Hola",
      replyTo: "reservas@wakayaecolodge.com",
      idempotencyKey: "booking-request:WR-2026-0001:initial-email",
      threadKey: "booking-request:WR-2026-0001",
      attachments: [
        {
          filename: "transfer-proof.pdf",
          content: "ZmFrZQ==",
          contentType: "application/pdf",
        },
      ],
    });

    expect(result).toEqual({
      status: "sent",
      provider: "resend",
      providerMessageId: "email_123",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, requestInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    const payload = JSON.parse(String(requestInit.body)) as {
      attachments?: Array<{ content: string; filename: string }>;
      headers?: Record<string, string>;
      reply_to?: string;
    };

    expect(url).toBe("https://api.resend.com/emails");
    expect(requestInit.headers).toMatchObject({
      "content-type": "application/json",
      authorization: "Bearer re_test",
      "Idempotency-Key": "booking-request:WR-2026-0001:initial-email",
    });
    expect(payload.reply_to).toBe("reservas@wakayaecolodge.com");
    expect(payload.headers).toMatchObject({
      "X-Wakaya-Thread-Key": "booking-request:WR-2026-0001",
      "X-Wakaya-Idempotency-Key": "booking-request:WR-2026-0001:initial-email",
    });
    expect(payload.attachments).toMatchObject([
      {
        filename: "transfer-proof.pdf",
        content: "ZmFrZQ==",
      },
    ]);
  });
});
