import { beforeEach, describe, expect, it, vi } from "vitest";

const { requirePermissionMock, listExperiencesMock, createExperienceMock } = vi.hoisted(() => ({
  requirePermissionMock: vi.fn(),
  listExperiencesMock: vi.fn(),
  createExperienceMock: vi.fn(),
}));

vi.mock("@/middleware/authn", () => ({
  requirePermission: requirePermissionMock,
}));

vi.mock("@/lib/content/store", () => ({
  contentStore: {
    listExperiences: listExperiencesMock,
    createExperience: createExperienceMock,
  },
}));

async function loadRoute() {
  return import("./route");
}

describe("/api/admin/content/experiences", () => {
  beforeEach(() => {
    vi.resetModules();
    requirePermissionMock.mockReset();
    listExperiencesMock.mockReset();
    createExperienceMock.mockReset();

    requirePermissionMock.mockResolvedValue({
      authenticated: true,
      roles: ["admin"],
      subject: "admin-user-1",
    });
  });

  it("lists experiences", async () => {
    listExperiencesMock.mockResolvedValue([{ id: "exp_01", slug: "paseo-laguna" }]);

    const { GET } = await loadRoute();
    const response = await GET(new Request("http://localhost/api/admin/content/experiences"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.items).toHaveLength(1);
  });

  it("creates an experience", async () => {
    createExperienceMock.mockResolvedValue({ id: "exp_09", slug: "nueva-experiencia", version: 1 });

    const { POST } = await loadRoute();
    const response = await POST(
      new Request("http://localhost/api/admin/content/experiences", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          slug: "nueva-experiencia",
          visible: true,
          featuredOnHome: false,
          sortOrder: 9,
          iconKey: "spark",
          content: {
            es: {
              title: "Nueva experiencia",
              summary: "Resumen ES",
              body: "Body ES",
              duration: "1 h",
              priceLabel: "S/ 40",
              ctaLabel: "Consultar",
              included: ["Guía"],
              recommendations: ["Reservar"],
            },
            en: {
              title: "New experience",
              summary: "Summary EN",
              body: "Body EN",
              duration: "1 h",
              priceLabel: "PEN 40",
              ctaLabel: "Enquire",
              included: ["Guide"],
              recommendations: ["Book"],
            },
          },
          cardAssetId: "asset_card_09",
          heroAssetId: "asset_hero_09",
          galleryAssetIds: ["asset_gallery_09"],
        }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(createExperienceMock).toHaveBeenCalledWith(
      expect.objectContaining({
        slug: "nueva-experiencia",
        iconKey: "spark",
      }),
    );
    expect(body.experience.id).toBe("exp_09");
  });
});
