import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  requireAdminPageAccessMock,
  listOperationsWorkbenchItemsMock,
  getOperationThreadViewMock,
  listQuickReplyTemplatesMock,
  listBungalowsMock,
  listUsersMock,
  redirectMock,
} = vi.hoisted(() => ({
  requireAdminPageAccessMock: vi.fn(),
  listOperationsWorkbenchItemsMock: vi.fn(),
  getOperationThreadViewMock: vi.fn(),
  listQuickReplyTemplatesMock: vi.fn(),
  listBungalowsMock: vi.fn(),
  listUsersMock: vi.fn(),
  redirectMock: vi.fn((href: string) => {
    throw new Error(`NEXT_REDIRECT:${href}`);
  }),
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("@/app/admin/require-admin-page-access", () => ({
  requireAdminPageAccess: requireAdminPageAccessMock,
}));

vi.mock("@/lib/backoffice-auth/store", () => ({
  backofficeAuthStore: {
    listUsers: listUsersMock,
  },
}));

vi.mock("@/lib/reservations/store", () => ({
  reservationStore: {
    listOperationsWorkbenchItems: listOperationsWorkbenchItemsMock,
    getOperationThreadView: getOperationThreadViewMock,
    listQuickReplyTemplates: listQuickReplyTemplatesMock,
    listBungalows: listBungalowsMock,
  },
}));

vi.mock("./booking-requests-workbench", () => ({
  BookingRequestsWorkbench: ({ items, selectedDetail }: Record<string, unknown>) => (
    <div>
      <div>operations-workbench</div>
      <div>{JSON.stringify(items)}</div>
      <div>{JSON.stringify(selectedDetail)}</div>
    </div>
  ),
}));

import RequestsAdminPage from "./page";

describe("operations workbench page", () => {
  beforeEach(() => {
    requireAdminPageAccessMock.mockReset();
    listOperationsWorkbenchItemsMock.mockReset();
    getOperationThreadViewMock.mockReset();
    listQuickReplyTemplatesMock.mockReset();
    listBungalowsMock.mockReset();
    listUsersMock.mockReset();
    redirectMock.mockClear();

    requireAdminPageAccessMock.mockResolvedValue({
      authenticated: true,
      roles: ["admin"],
      subject: "dev-admin",
    });
    listUsersMock.mockResolvedValue([
      { id: "user-1", name: "Recepción", email: "recepcion@wakaya.local", active: true },
    ]);
    listQuickReplyTemplatesMock.mockResolvedValue([]);
    listBungalowsMock.mockResolvedValue([]);
  });

  it("hydrates the unified queue with OTA reservations and web requests", async () => {
    listOperationsWorkbenchItemsMock.mockResolvedValue([
      {
        kind: "reservation",
        id: "reservation-ota-1",
        displayRef: "RESERVATION-2026-0010",
        publicRef: null,
        reservationNumber: "RESERVATION-2026-0010",
        guestName: "Ada Lovelace",
        guestEmail: "ada@example.com",
        status: "ota_imported_confirmed",
        lane: "pending_mapping",
        needsReply: false,
        latestCustomerMessageAt: null,
        latestTeamMessageAt: null,
        lastSnippet: "Booking.com importada",
        ownerUserId: null,
        ownerAssignedAt: null,
        ownerName: null,
        hasConflict: false,
        syncHealth: "pending",
        sourceProvider: "booking_com",
        requestedCheckIn: "2026-07-20",
        requestedCheckOut: "2026-07-22",
        requestedGuests: 2,
        requestedBungalowType: null,
        updatedAt: "2026-07-09T22:00:00.000Z",
      },
    ]);
    getOperationThreadViewMock.mockResolvedValue({
      kind: "reservation",
      bookingRequest: null,
      reservation: { id: "reservation-ota-1", number: "RESERVATION-2026-0010" },
      thread: null,
      messages: [],
      attachments: [],
      conflicts: [],
      otaLink: null,
      workItem: { id: "reservation-ota-1", kind: "reservation", displayRef: "RESERVATION-2026-0010" },
    });

    const html = renderToStaticMarkup(
      await RequestsAdminPage({ searchParams: { selected: "reservation-ota-1" } }),
    );

    expect(listOperationsWorkbenchItemsMock).toHaveBeenCalledWith({
      lane: undefined,
      ownerUserId: undefined,
      query: undefined,
    });
    expect(getOperationThreadViewMock).toHaveBeenCalledWith("reservation-ota-1");
    expect(html).toContain("operations-workbench");
    expect(html).toContain("RESERVATION-2026-0010");
    expect(html).toContain("booking_com");
  });
});
