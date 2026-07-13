import { beforeEach, describe, expect, it, vi } from "vitest";

const { requirePermissionMock, getBookingRequestThreadViewMock } = vi.hoisted(() => ({
  requirePermissionMock: vi.fn(),
  getBookingRequestThreadViewMock: vi.fn(),
}));

vi.mock("@/middleware/authn", () => ({
  requirePermission: requirePermissionMock,
}));

vi.mock("@/lib/reservations/store", () => ({
  reservationStore: {
    getBookingRequestThreadView: getBookingRequestThreadViewMock,
  },
}));

async function loadRoute() {
  requirePermissionMock.mockResolvedValue({
    authenticated: true,
    roles: ["admin"],
    subject: "dev-admin",
  });
  return import("./route");
}

describe("GET /api/booking-requests/[id]/attachments/[attachmentId]", () => {
  beforeEach(() => {
    vi.resetModules();
    requirePermissionMock.mockReset();
    getBookingRequestThreadViewMock.mockReset();
  });

  it("streams the stored attachment when the booking request and binary exist", async () => {
    getBookingRequestThreadViewMock.mockResolvedValue({
      bookingRequest: { id: "request-1" },
      thread: null,
      messages: [],
      conflicts: [],
      attachments: [
        {
          id: "attachment-1",
          messageId: "message-1",
          providerAttachmentId: "provider-1",
          fileName: "proof.pdf",
          contentType: "application/pdf",
          fileSizeBytes: 4,
          storageKey: "thread/message/proof.pdf",
          fileHash: "hash-1",
          isSupported: true,
          contentBase64: "ZmFrZQ==",
          createdAt: "2026-07-07T00:00:00.000Z",
        },
      ],
    });

    const { GET } = await loadRoute();
    const response = await GET(new Request("http://localhost/api/booking-requests/request-1/attachments/attachment-1"), {
      params: Promise.resolve({ id: "request-1", attachmentId: "attachment-1" }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/pdf");
    expect(response.headers.get("content-disposition")).toContain('filename="proof.pdf"');
    expect(Buffer.from(await response.arrayBuffer()).toString("utf8")).toBe("fake");
  });

  it("normalizes the response content type from the file extension when the provider stored octet-stream", async () => {
    getBookingRequestThreadViewMock.mockResolvedValue({
      bookingRequest: { id: "request-1" },
      thread: null,
      messages: [],
      conflicts: [],
      attachments: [
        {
          id: "attachment-2",
          messageId: "message-2",
          providerAttachmentId: "provider-2",
          fileName: "voucher.jpg",
          contentType: "application/octet-stream",
          fileSizeBytes: 4,
          storageKey: "thread/message/voucher.jpg",
          fileHash: "hash-2",
          isSupported: false,
          contentBase64: "ZmFrZQ==",
          createdAt: "2026-07-07T00:00:00.000Z",
        },
      ],
    });

    const { GET } = await loadRoute();
    const response = await GET(new Request("http://localhost/api/booking-requests/request-1/attachments/attachment-2"), {
      params: Promise.resolve({ id: "request-1", attachmentId: "attachment-2" }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/jpeg");
    expect(response.headers.get("content-disposition")).toContain('filename="voucher.jpg"');
  });
});
