import { afterEach, describe, expect, it, vi } from "vitest";

const { buildReservationServiceMock, dbListBungalowPublicContentMock } = vi.hoisted(() => ({
  buildReservationServiceMock: vi.fn(),
  dbListBungalowPublicContentMock: vi.fn(),
}));

vi.mock("@/lib/reservations/service", () => ({
  buildReservationService: buildReservationServiceMock,
}));

describe("reservationStore runtime provider selection", () => {
  const originalDatabaseUrl = process.env.DATABASE_URL;

  afterEach(() => {
    if (originalDatabaseUrl) {
      process.env.DATABASE_URL = originalDatabaseUrl;
    } else {
      delete process.env.DATABASE_URL;
    }
    vi.resetModules();
    buildReservationServiceMock.mockReset();
    dbListBungalowPublicContentMock.mockReset();
  });

  it("switches to PostgreSQL at access time when DATABASE_URL appears after module import", async () => {
    delete process.env.DATABASE_URL;
    dbListBungalowPublicContentMock.mockResolvedValue([
      { bungalowId: "bungalow-family", heroImageUrl: "db://hero" },
    ]);
    buildReservationServiceMock.mockReturnValue({
      listBungalowPublicContent: dbListBungalowPublicContentMock,
    });

    const { reservationStore } = await import("./store");

    process.env.DATABASE_URL = "postgres://postgres:postgres@localhost:5432/wakaya-erp";
    const items = await reservationStore.listBungalowPublicContent();

    expect(buildReservationServiceMock).toHaveBeenCalledTimes(1);
    expect(dbListBungalowPublicContentMock).toHaveBeenCalledTimes(1);
    expect(items).toEqual([{ bungalowId: "bungalow-family", heroImageUrl: "db://hero" }]);
  });
});
