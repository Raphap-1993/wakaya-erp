import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { listThreadMessages, resetZohoTokenCacheForTests } from "@/lib/mail/zoho-client";

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

describe("zoho-client", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    resetZohoTokenCacheForTests();
    process.env.ZOHO_MAIL_ACCOUNT_ID = "account-1";
    process.env.ZOHO_CLIENT_ID = "client-id";
    process.env.ZOHO_CLIENT_SECRET = "client-secret";
    process.env.ZOHO_REFRESH_TOKEN = "refresh-token";
    process.env.ZOHO_ACCOUNTS_BASE_URL = "https://accounts.zoho.test";
    delete process.env.ZOHO_MAIL_ACCESS_TOKEN;
  });

  afterEach(() => {
    resetZohoTokenCacheForTests();
  });

  it("hydrates inline email images from message content and attachmentinfo", async () => {
    const inlineImageHtml =
      '<div dir="auto"><img alt="image0.jpeg" src="/mail/ImageDisplay?cid=inline-1">Enviado desde mi iPhone</div>';
    const imageBuffer = Uint8Array.from([0xff, 0xd8, 0xff, 0xd9]);

    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ access_token: "access-token", expires_in: 3600 }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: [
              {
                messageId: "message-1",
                threadId: "thread-1",
                folderId: "folder-1",
                fromAddress: "guest@example.com",
                toAddress: "reservas@wakayaecolodge.com",
                subject: "Re: Solicitud WR-2026-0004",
                summary: "Enviado desde mi iPhone",
                hasAttachment: "0",
                sentTime: "1720569000000",
                receivedTime: "1720569060000",
              },
            ],
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: { content: inlineImageHtml } }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: {
              attachments: [],
              inline: [
                {
                  attachmentId: "inline-attachment-1",
                  attachmentName: "1.jpg",
                  attachmentSize: 161480,
                  cid: "inline-1",
                },
              ],
            },
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        ),
      )
      .mockResolvedValueOnce(
        new Response(imageBuffer, {
          status: 200,
          headers: { "content-type": "application/octet-stream" },
        }),
      );

    const result = await listThreadMessages("thread-1");

    expect(result).toHaveLength(1);
    expect(result[0]?.bodyText).toBe("Enviado desde mi iPhone");
    expect(result[0]?.bodyHtml).toContain('src="/mail/ImageDisplay?cid=inline-1"');
    expect(result[0]?.attachments).toHaveLength(1);
    expect(result[0]?.attachments[0]).toMatchObject({
      providerAttachmentId: "inline-attachment-1",
      fileName: "1.jpg",
      contentType: "image/jpeg",
      fileSizeBytes: 161480,
      contentBase64: Buffer.from(imageBuffer).toString("base64"),
    });
  });
});
