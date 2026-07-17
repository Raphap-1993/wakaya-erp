import { beforeEach, describe, expect, it, vi } from "vitest";

import { listDefaultBungalowPublicContent } from "@/lib/reservations/wakaya-bungalow-public-content";
import { WAKAYA_OPERATIONAL_BUNGALOWS } from "@/lib/reservations/wakaya-bungalows";

import { getLocalizedBungalows } from "./public-site-content";

const reservationStoreMocks = vi.hoisted(() => ({
  listBungalows: vi.fn(),
  listBungalowPublicContent: vi.fn(),
}));

vi.mock("@/lib/reservations/store", () => ({
  reservationStore: reservationStoreMocks,
}));

const EXPECTED_BUNGALOW_ORDER = [
  "bungalow-family",
  "bungalow-matrimonial",
  "bungalow-individual",
  "bungalow-suite",
  "bungalow-triple",
];

beforeEach(() => {
  reservationStoreMocks.listBungalows.mockReset();
  reservationStoreMocks.listBungalowPublicContent.mockReset();
});

function mockBungalowContent(sortOrders: Record<string, number>) {
  reservationStoreMocks.listBungalows.mockResolvedValue(
    WAKAYA_OPERATIONAL_BUNGALOWS.map((item) => ({ ...item })),
  );
  reservationStoreMocks.listBungalowPublicContent.mockResolvedValue(
    listDefaultBungalowPublicContent().map((item) => ({
      ...item,
      sortOrder: sortOrders[item.bungalowId] ?? item.sortOrder,
    })),
  );
}

describe("public bungalow ordering", () => {
  it("honors the unique order published from the backoffice", async () => {
    mockBungalowContent({
      "bungalow-family": 5,
      "bungalow-matrimonial": 4,
      "bungalow-individual": 3,
      "bungalow-suite": 2,
      "bungalow-triple": 1,
    });

    const rooms = await getLocalizedBungalows("es");

    expect(rooms.map((room) => room.bookingRequestBungalowId)).toEqual([
      "bungalow-triple",
      "bungalow-suite",
      "bungalow-individual",
      "bungalow-matrimonial",
      "bungalow-family",
    ]);
  });

  it("uses the approved Wakaya sequence when saved order values are duplicated", async () => {
    mockBungalowContent(
      Object.fromEntries(EXPECTED_BUNGALOW_ORDER.map((id) => [id, 1])),
    );

    const rooms = await getLocalizedBungalows("es");

    expect(rooms.map((room) => room.bookingRequestBungalowId)).toEqual(
      EXPECTED_BUNGALOW_ORDER,
    );
  });
});
