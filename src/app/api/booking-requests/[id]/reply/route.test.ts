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

describe("POST /api/booking-requests/[id]/reply", () => {
  beforeEach(() => {
    vi.resetModules();
    requirePermissionMock.mockReset();
  });

  it("sends a reply in the same operational thread", async () => {
    process.env.ZOHO_MAIL_ACCOUNT_ID = "zoho-account";
    process.env.ZOHO_MAIL_ACCESS_TOKEN = "zoho-token";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: {
            messageId: "zoho-reply-1",
            threadId: "zoho-thread-1",
            sentTime: "2026-07-01T12:00:00.000Z",
          },
        }),
      }),
    );

    const { POST } = await loadRoute();
    const response = await POST(
      new Request("http://localhost/api/booking-requests/request-1/reply", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: "Bearer valid" },
        body: JSON.stringify({
          bodyText: "Gracias. Validaremos tu transferencia hoy.",
        }),
      }),
      { params: Promise.resolve({ id: "request-1" }) },
    );

    expect(response.status).toBe(200);
    expect(requirePermissionMock).toHaveBeenCalledWith(expect.any(Request), "reservation:write");
    await expect(response.json()).resolves.toMatchObject({
      reply: {
        providerMessageId: "zoho-reply-1",
      },
    });
  });
});
