import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReservationListItem } from "@/lib/reservations/store";
import type { ReservationAudit } from "@/lib/reservations/types";
import { reservationStore } from "@/lib/reservations/store";

const { useRouterMock } = vi.hoisted(() => ({
  useRouterMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: useRouterMock,
}));

import OccupancyView from "./occupancy-view";

function makeReservation(overrides: Partial<ReservationListItem>): ReservationListItem {
  return {
    id: overrides.id ?? "reservation-test",
    number: overrides.number ?? "RESERVATION-TEST-0001",
    channel: overrides.channel ?? "web",
    status: overrides.status ?? "paid",
    paymentStatus: overrides.paymentStatus ?? "paid",
    amountTotalCents: overrides.amountTotalCents ?? 12000,
    amountPaidCents: overrides.amountPaidCents ?? 12000,
    currencyCode: "PEN",
    bungalowId: overrides.bungalowId ?? "bungalow-suite",
    responsibleId: overrides.responsibleId ?? "guest-1",
    startDate: overrides.startDate ?? "2026-06-11",
    endDate: overrides.endDate ?? "2026-06-12",
    updatedAt: overrides.updatedAt ?? "2026-06-01T00:00:00.000Z",
    bungalow: overrides.bungalow ?? null,
  };
}

describe("OccupancyView", () => {
  beforeEach(() => {
    useRouterMock.mockReturnValue({
      replace: vi.fn(),
    });
  });

  it("renders the weekly grid and the selected detail with distinct occupancy states", () => {
    const items = [
      makeReservation({
        id: "reservation-paid-1",
        number: "RESERVATION-PAID-1",
        bungalowId: "bungalow-suite",
        status: "paid",
        paymentStatus: "paid",
        startDate: "2026-06-11",
        endDate: "2026-06-12",
      }),
      makeReservation({
        id: "reservation-attention-1",
        number: "RESERVATION-ATTN-1",
        bungalowId: "bungalow-family",
        status: "pending_review",
        paymentStatus: "pending",
        startDate: "2026-06-13",
        endDate: "2026-06-13",
      }),
      makeReservation({
        id: "reservation-blocked-1",
        number: "RESERVATION-BLOCK-1",
        bungalowId: "bungalow-matrimonial",
        status: "paid",
        paymentStatus: "paid",
        startDate: "2026-06-14",
        endDate: "2026-06-14",
      }),
      makeReservation({
        id: "reservation-blocked-2",
        number: "RESERVATION-BLOCK-2",
        bungalowId: "bungalow-matrimonial",
        status: "confirmed",
        paymentStatus: "paid",
        startDate: "2026-06-14",
        endDate: "2026-06-14",
      }),
    ];

    const auditsByReservationId: Record<string, ReservationAudit[]> = {
      "reservation-paid-1": [
        {
          id: "audit-1",
          reservationId: "reservation-paid-1",
          actorId: "system",
          action: "create",
          previousStatus: "paid",
          nextStatus: "paid",
          reason: "Ingreso inicial",
          createdAt: "2026-06-01T12:00:00.000Z",
        },
      ],
    };

    const html = renderToStaticMarkup(
      <OccupancyView
        items={items}
        bungalows={reservationStore.listBungalows()}
        query={{
          week: "2026-W24",
          date: "2026-06-11",
          selected: "reservation-paid-1",
          view: "occupancy",
        }}
        auditsByReservationId={auditsByReservationId}
      />,
    );

    expect(html).toContain("Grilla semanal de bungalows");
    expect(html).toContain("Ocupación semanal");
    expect(html).toContain("RESERVATION-PAID-1");
    expect(html).toContain("Bungalow Suite");
    expect(html).toContain("2026-W24");
    expect(html).toContain("Semana");
    expect(html).toContain("2026-06-11");
    expect(html).toContain("Ocupado");
    expect(html).toContain("Libre");
    expect(html).toContain("Atención");
    expect(html).toContain("Bloqueado");
    expect(html).toContain("Ver reserva");
    expect(html).toContain("Abrir agenda operativa");
    expect(html).toContain("Pagado");
    expect(html).toContain("Auditoría reciente");
    expect(html).toContain("Ingreso inicial");
  });
});
