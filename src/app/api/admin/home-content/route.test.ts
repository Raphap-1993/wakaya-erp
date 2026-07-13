import { beforeEach, describe, expect, it, vi } from "vitest";

const { requirePermissionMock, getPublishedMock, listRevisionsMock, publishMock } = vi.hoisted(() => ({
  requirePermissionMock: vi.fn(),
  getPublishedMock: vi.fn(),
  listRevisionsMock: vi.fn(),
  publishMock: vi.fn(),
}));

vi.mock("@/middleware/authn", () => ({
  requirePermission: requirePermissionMock,
}));

vi.mock("@/lib/home-content/store", () => ({
  homeContentStore: {
    getPublished: getPublishedMock,
    listRevisions: listRevisionsMock,
    publish: publishMock,
  },
}));

import { DEFAULT_HOME_CONTENT } from "@/lib/home-content/default-content";

async function loadRoute() {
  return import("./route");
}

describe("/api/admin/home-content", () => {
  beforeEach(() => {
    vi.resetModules();
    requirePermissionMock.mockReset();
    getPublishedMock.mockReset();
    listRevisionsMock.mockReset();
    publishMock.mockReset();

    requirePermissionMock.mockResolvedValue({
      authenticated: true,
      roles: ["admin"],
      subject: "admin-user-1",
    });
    getPublishedMock.mockResolvedValue({
      revisionVersion: 2,
      document: DEFAULT_HOME_CONTENT,
      updatedAt: "2026-07-09T12:00:00.000Z",
      updatedByUserId: "admin-user-1",
      restoredFromVersion: null,
      source: "published",
    });
    listRevisionsMock.mockResolvedValue([
      {
        revisionVersion: 2,
        document: DEFAULT_HOME_CONTENT,
        updatedAt: "2026-07-09T12:00:00.000Z",
        updatedByUserId: "admin-user-1",
        restoredFromVersion: null,
        source: "published",
      },
    ]);
    publishMock.mockResolvedValue({
      revisionVersion: 3,
      document: DEFAULT_HOME_CONTENT,
      updatedAt: "2026-07-09T13:00:00.000Z",
      updatedByUserId: "admin-user-1",
      restoredFromVersion: null,
      source: "published",
    });
  });

  it("returns the published document and revision history", async () => {
    const { GET } = await loadRoute();
    const response = await GET(new Request("http://localhost/api/admin/home-content"));
    const body = await response.json();

    expect(requirePermissionMock).toHaveBeenCalledWith(expect.any(Request), "content:write");
    expect(response.status).toBe(200);
    expect(body.item.revisionVersion).toBe(2);
    expect(body.revisions).toHaveLength(1);
  });

  it("publishes a validated home-content document", async () => {
    const { PUT } = await loadRoute();
    const response = await PUT(
      new Request("http://localhost/api/admin/home-content", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          expectedVersion: 2,
          document: DEFAULT_HOME_CONTENT,
        }),
      }),
    );
    const body = await response.json();

    expect(requirePermissionMock).toHaveBeenCalledWith(expect.any(Request), "content:write");
    expect(response.status).toBe(200);
    expect(publishMock).toHaveBeenCalledWith({
      document: DEFAULT_HOME_CONTENT,
      expectedVersion: 2,
      actorId: "admin-user-1",
    });
    expect(body.item.revisionVersion).toBe(3);
  });

  it("allows optional slide text fields to be submitted empty", async () => {
    const payload = structuredClone(DEFAULT_HOME_CONTENT);
    payload.slider.slides[1].content.es.subtitle = "";
    payload.slider.slides[1].content.es.copy = "";
    payload.slider.slides[1].content.es.scrollLabel = " ";

    const { PUT } = await loadRoute();
    const response = await PUT(
      new Request("http://localhost/api/admin/home-content", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          expectedVersion: 2,
          document: payload,
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(publishMock).toHaveBeenCalledWith({
      document: expect.objectContaining({
        slider: expect.objectContaining({
          slides: expect.arrayContaining([
            expect.objectContaining({
              id: payload.slider.slides[1].id,
              content: expect.objectContaining({
                es: expect.objectContaining({
                  subtitle: undefined,
                  copy: undefined,
                  scrollLabel: undefined,
                }),
              }),
            }),
          ]),
        }),
      }),
      expectedVersion: 2,
      actorId: "admin-user-1",
    });
  });
});
