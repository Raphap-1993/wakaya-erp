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
    subject: "user-admin-1",
  });
  return import("./route");
}

describe("POST /api/reservations/[id]/assign", () => {
  beforeEach(() => {
    vi.resetModules();
    requirePermissionMock.mockReset();
  });

  it("assigns an OTA reservation by bungalow category without a physical unit", async () => {
    const { POST } = await loadRoute();
    const response = await POST(
      new Request("http://localhost/api/reservations/reservation-demo-2/assign", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          bungalowId: "bungalow-family",
          actorId: "user-reception-1",
          reason: "assign bungalow on arrival",
        }),
      }),
      { params: { id: "reservation-demo-2" } },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.reservation.status).toBe("assigned");
    expect(body.reservation.bungalowId).toBe("bungalow-family");
    expect(body.reservation.bungalowUnitId).toBeNull();
  });

  it("accepts form submissions from the admin monitor", async () => {
    const { POST } = await loadRoute();
    const response = await POST(
      new Request("http://localhost/api/reservations/reservation-demo-2/assign", {
        method: "POST",
        body: new URLSearchParams({
          bungalowId: "bungalow-suite",
          reason: "assign bungalow on arrival",
          actorId: "user-reception-1",
        }),
      }),
      { params: { id: "reservation-demo-2" } },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.reservation.status).toBe("assigned");
  });

  it("returns 409 without individual suggestions when the category is sold out", async () => {
    const { reservationStore } = await import("@/lib/reservations/store");
    const target = await reservationStore.create({
      number: `OTA-ASSIGN-TARGET-${crypto.randomUUID()}`,
      channel: "ota",
      bungalowId: "bungalow-individual",
      actorId: "system",
      startDate: "2026-08-20",
      endDate: "2026-08-21",
    });
    for (let index = 1; index <= 5; index += 1) {
      try {
        await reservationStore.create({
          number: `OTA-FAMILY-SOLD-${crypto.randomUUID()}`,
          channel: "ota",
          bungalowId: "bungalow-family",
          actorId: "system",
          startDate: "2026-08-20",
          endDate: "2026-08-21",
        });
      } catch (error) {
        if (!(error instanceof Error) || error.message !== "bungalow_capacity_unavailable") throw error;
        break;
      }
    }

    const { POST } = await loadRoute();
    const response = await POST(
      new Request("http://localhost/api/reservations/reservation-demo-2/assign", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          bungalowId: "bungalow-family",
          actorId: "user-reception-1",
          reason: "assign bungalow on arrival",
        }),
      }),
      { params: { id: target.reservation.id } },
    );
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body).toEqual({
      error: "bungalow_capacity_unavailable",
      message: "No hay cupos disponibles para esa categoría y rango.",
    });
  });

  it("rejects the retired unitId field", async () => {
    const { POST } = await loadRoute();
    const response = await POST(
      new Request("http://localhost/api/reservations/reservation-demo-2/assign", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          bungalowId: "bungalow-family",
          unitId: "unit_fam_02",
          reason: "legacy payload",
        }),
      }),
      { params: { id: "reservation-demo-2" } },
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ error: "invalid_payload" });
  });

  it("rejects an invalid assignment payload", async () => {
    const { POST } = await loadRoute();
    const response = await POST(
      new Request("http://localhost/api/reservations/reservation-demo-2/assign", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          bungalowId: "",
          reason: "",
        }),
      }),
      { params: { id: "reservation-demo-2" } },
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("invalid_payload");
  });
});
