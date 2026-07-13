import { beforeEach, describe, expect, it, vi } from "vitest";

const { requirePermissionMock } = vi.hoisted(() => ({
  requirePermissionMock: vi.fn(),
}));

vi.mock("@/middleware/authn", () => ({
  requirePermission: requirePermissionMock,
}));

async function loadRoute() {
  requirePermissionMock.mockResolvedValue({
    authenticated: true,
    roles: ["admin"],
    subject: "user-reception-1",
  });
  return import("./route");
}

describe("POST /api/booking-requests/[id]/sync", () => {
  beforeEach(() => {
    vi.resetModules();
    requirePermissionMock.mockReset();
  });

  it("persists inbound thread messages and supported attachments", async () => {
    process.env.ZOHO_MAIL_ACCOUNT_ID = "zoho-account";
    process.env.ZOHO_MAIL_ACCESS_TOKEN = "zoho-token";
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string | URL | Request) => {
        const url = String(input);

        if (url.includes("/messages/view?")) {
          return {
            ok: true,
            json: async () => ({
              data: [
                {
                  messageId: "zoho-msg-1",
                  threadId: "zoho-thread-1",
                  folderId: "inbox",
                  fromAddress: "ada@example.com",
                  toAddress: "reservas@wakayaecolodge.com",
                  subject: "Comprobante WR-2026-0001",
                  summary: "Adjunto comprobante",
                  receivedTime: "2026-07-01T10:00:00.000Z",
                  attachments: [
                    {
                      attachmentId: "att-1",
                      fileName: "proof.pdf",
                      contentType: "application/pdf",
                      size: 2048,
                      contentBase64: "ZmFrZQ==",
                    },
                  ],
                },
              ],
            }),
          };
        }

        if (url.includes("/content?")) {
          return {
            ok: true,
            json: async () => ({ data: { content: "<p>Adjunto comprobante</p>" } }),
          };
        }

        if (url.includes("/attachmentinfo?")) {
          return {
            ok: true,
            json: async () => ({ data: { attachments: [], inline: [] } }),
          };
        }

        throw new Error(`Unexpected fetch: ${url}`);
      }),
    );

    const { POST } = await loadRoute();
    const response = await POST(
      new Request("http://localhost/api/booking-requests/request-1/sync", {
        method: "POST",
        headers: { authorization: "Bearer valid" },
      }),
      { params: Promise.resolve({ id: "request-1" }) },
    );

    expect(response.status).toBe(200);
    expect(requirePermissionMock).toHaveBeenCalledWith(expect.any(Request), "reservation:write");
    await expect(response.json()).resolves.toMatchObject({
      thread: {
        provider: "zoho_mail",
        messageCount: 2,
      },
      attachments: [
        {
          fileName: "proof.pdf",
          isSupported: true,
        },
      ],
    });
  });
});
