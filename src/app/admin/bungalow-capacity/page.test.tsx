import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  requireAdminPageAccessMock,
  listCapacitiesMock,
  listReservationsMock,
  listBungalowsMock,
} = vi.hoisted(() => ({
  requireAdminPageAccessMock: vi.fn(),
  listCapacitiesMock: vi.fn(),
  listReservationsMock: vi.fn(),
  listBungalowsMock: vi.fn(),
}));

vi.mock("@/app/admin/require-admin-page-access", () => ({
  requireAdminPageAccess: requireAdminPageAccessMock,
}));
vi.mock("@/lib/bungalow-capacity/store", () => ({
  bungalowCapacityStore: {
    listCapacities: listCapacitiesMock,
  },
}));
vi.mock("@/lib/reservations/store", () => ({
  reservationStore: {
    list: listReservationsMock,
    listBungalows: listBungalowsMock,
  },
}));

import AdminBungalowCapacityPage from "./page";

const bungalowSeeds = [
  ["bungalow-family", "Bungalow Familiar", 4, 5],
  ["bungalow-matrimonial", "Bungalow Matrimonial", 2, 4],
  ["bungalow-individual", "Bungalow Individual", 1, 5],
  ["bungalow-suite", "Bungalow Doble", 2, 2],
  ["bungalow-triple", "Bungalow Triple", 3, 1],
] as const;

describe("AdminBungalowCapacityPage", () => {
  beforeEach(() => {
    requireAdminPageAccessMock.mockResolvedValue({ authenticated: true, roles: ["admin"], subject: "user-admin-1" });
    listBungalowsMock.mockResolvedValue(
      bungalowSeeds.map(([id, name, guestCapacity]) => ({ id, name, capacity: guestCapacity, active: true })),
    );
    listCapacitiesMock.mockResolvedValue(
      bungalowSeeds.map(([bungalowId, , , totalUnits]) => ({
        bungalowId,
        totalUnits,
        version: 1,
        updatedBy: null,
        createdAt: "2026-07-12T00:00:00.000Z",
        updatedAt: "2026-07-12T00:00:00.000Z",
      })),
    );
    listReservationsMock.mockResolvedValue([]);
  });

  it("renders five category capacities, critical nights and only aggregate actions", async () => {
    const html = renderToStaticMarkup(
      await AdminBungalowCapacityPage({
        searchParams: Promise.resolve({ checkIn: "2026-08-10", checkOut: "2026-08-12" }),
      }),
    );

    expect(requireAdminPageAccessMock).toHaveBeenCalledWith("/admin/bungalow-capacity", "inventory:manage");
    expect(html).toContain("Cupos de bungalows");
    expect(html).toContain("Total físico");
    expect(html).toContain("17");
    for (const [, name] of bungalowSeeds) expect(html).toContain(name);
    expect(html).toContain("Fecha crítica");
    expect(html).toContain("Editar total");
    expect(html).not.toContain("Bloquear cupos");
    expect(html).not.toContain("Bloqueadas");
    expect(html).not.toContain("Bloqueos activos");
    expect(html).not.toContain("Cancelar bloqueo");
    expect(html).not.toContain("FAM-01");
    expect(html).not.toContain("unitId");
    expect(html).not.toContain("Nueva unidad");
    expect(html).not.toContain("Archivar unidad");
  });
});
