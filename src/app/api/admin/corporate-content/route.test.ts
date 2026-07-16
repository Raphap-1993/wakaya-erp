import { beforeEach, describe, expect, it, vi } from "vitest";

const { requirePermissionMock, getPublishedMock, listRevisionsMock, publishMock } = vi.hoisted(() => ({
  requirePermissionMock: vi.fn(),
  getPublishedMock: vi.fn(),
  listRevisionsMock: vi.fn(),
  publishMock: vi.fn(),
}));

vi.mock("@/middleware/authn", () => ({ requirePermission: requirePermissionMock }));
vi.mock("@/lib/corporate-content/store", () => ({
  corporateContentStore: {
    getPublished: getPublishedMock,
    listRevisions: listRevisionsMock,
    publish: publishMock,
  },
}));

import { DEFAULT_CORPORATE_CONTENT } from "@/lib/corporate-content/default-document";
import { GET, PUT } from "./route";

describe("/api/admin/corporate-content", () => {
  beforeEach(() => {
    requirePermissionMock.mockReset();
    getPublishedMock.mockReset();
    listRevisionsMock.mockReset();
    publishMock.mockReset();
    requirePermissionMock.mockResolvedValue({ subject: "admin-1" });
    getPublishedMock.mockResolvedValue({ revisionVersion: 0, document: DEFAULT_CORPORATE_CONTENT });
    listRevisionsMock.mockResolvedValue([]);
  });

  it("requires content:write and returns the published document", async () => {
    const response = await GET(new Request("http://localhost/api/admin/corporate-content"));

    expect(requirePermissionMock).toHaveBeenCalledWith(expect.any(Request), "content:write");
    expect(response.status).toBe(200);
    expect((await response.json()).item.document.contact.whatsapp).toBe("+51 961 508 813");
  });

  it("publishes a validated document using optimistic concurrency", async () => {
    publishMock.mockResolvedValue({
      revisionVersion: 1,
      document: DEFAULT_CORPORATE_CONTENT,
      source: "published",
    });

    const response = await PUT(
      new Request("http://localhost/api/admin/corporate-content", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ expectedVersion: 0, document: DEFAULT_CORPORATE_CONTENT }),
      }),
    );

    expect(response.status).toBe(200);
    expect(publishMock).toHaveBeenCalledWith({
      expectedVersion: 0,
      document: DEFAULT_CORPORATE_CONTENT,
      actorId: "admin-1",
    });
  });

  it("returns 409 for a stale editor", async () => {
    publishMock.mockRejectedValue(new Error("corporate_content_version_conflict"));

    const response = await PUT(
      new Request("http://localhost/api/admin/corporate-content", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ expectedVersion: 0, document: DEFAULT_CORPORATE_CONTENT }),
      }),
    );

    expect(response.status).toBe(409);
  });

  it("rejects attempts to rewrite the historical source archive", async () => {
    const tampered = structuredClone(DEFAULT_CORPORATE_CONTENT);
    tampered.internal.legacyPages[0].paragraphs = ["Texto reemplazado"];

    const response = await PUT(
      new Request("http://localhost/api/admin/corporate-content", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ expectedVersion: 0, document: tampered }),
      }),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "corporate_content_internal_read_only" });
    expect(publishMock).not.toHaveBeenCalled();
  });
});
