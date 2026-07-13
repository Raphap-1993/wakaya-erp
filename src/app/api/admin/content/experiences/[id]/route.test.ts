import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  requirePermissionMock,
  getExperienceByIdMock,
  updateExperienceMock,
  archiveExperienceMock,
} = vi.hoisted(() => ({
  requirePermissionMock: vi.fn(),
  getExperienceByIdMock: vi.fn(),
  updateExperienceMock: vi.fn(),
  archiveExperienceMock: vi.fn(),
}));

vi.mock("@/middleware/authn", () => ({
  requirePermission: requirePermissionMock,
}));

vi.mock("@/lib/content/store", () => ({
  contentStore: {
    getExperienceById: getExperienceByIdMock,
    updateExperience: updateExperienceMock,
    archiveExperience: archiveExperienceMock,
  },
}));

async function loadRoute() {
  return import("./route");
}

describe("/api/admin/content/experiences/[id]", () => {
  beforeEach(() => {
    vi.resetModules();
    requirePermissionMock.mockReset();
    getExperienceByIdMock.mockReset();
    updateExperienceMock.mockReset();
    archiveExperienceMock.mockReset();

    requirePermissionMock.mockResolvedValue({
      authenticated: true,
      roles: ["admin"],
      subject: "admin-user-1",
    });
    getExperienceByIdMock.mockResolvedValue({ id: "exp_01", slug: "paseo-laguna", version: 2 });
  });

  it("loads one experience", async () => {
    const { GET } = await loadRoute();
    const response = await GET(new Request("http://localhost/api/admin/content/experiences/exp_01"), {
      params: { id: "exp_01" },
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.experience.slug).toBe("paseo-laguna");
  });

  it("updates an experience", async () => {
    updateExperienceMock.mockResolvedValue({ id: "exp_01", slug: "paseo-laguna", version: 3 });

    const { PUT } = await loadRoute();
    const response = await PUT(
      new Request("http://localhost/api/admin/content/experiences/exp_01", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          expectedVersion: 2,
          slug: "paseo-laguna",
          visible: true,
          featuredOnHome: true,
          sortOrder: 1,
          iconKey: "lagoon",
          content: {
            es: {
              title: "Paseo por la laguna",
              summary: "Resumen ES",
              body: "Body ES",
              duration: "45 min",
              priceLabel: "S/ 120",
              ctaLabel: "Consultar",
              included: ["Guía"],
              recommendations: ["Reservar"],
            },
            en: {
              title: "Lagoon walk",
              summary: "Summary EN",
              body: "Body EN",
              duration: "45 min",
              priceLabel: "PEN 120",
              ctaLabel: "Enquire",
              included: ["Guide"],
              recommendations: ["Book"],
            },
          },
          cardAssetId: "asset_card_01",
          heroAssetId: "asset_hero_01",
          galleryAssetIds: ["asset_gallery_01"],
        }),
      }),
      { params: { id: "exp_01" } },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(updateExperienceMock).toHaveBeenCalledWith(
      "exp_01",
      expect.objectContaining({
        expectedVersion: 2,
      }),
    );
    expect(body.experience.version).toBe(3);
  });

  it("archives an experience", async () => {
    archiveExperienceMock.mockResolvedValue({ id: "exp_01", deletedAt: "2026-07-10T00:00:00.000Z" });

    const { DELETE } = await loadRoute();
    const response = await DELETE(
      new Request("http://localhost/api/admin/content/experiences/exp_01", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ expectedVersion: 2 }),
      }),
      { params: { id: "exp_01" } },
    );

    expect(response.status).toBe(200);
    expect(archiveExperienceMock).toHaveBeenCalledWith("exp_01", 2);
  });
});
