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
  BookingRequestsWorkbench: ({ items, selectedDetail, ownerOptions, templates }: Record<string, unknown>) => (
    <div>
      <div>workbench</div>
      <div>{JSON.stringify(items)}</div>
      <div>{JSON.stringify(selectedDetail)}</div>
      <div>{JSON.stringify(ownerOptions)}</div>
      <div>{JSON.stringify(templates)}</div>
    </div>
  ),
}));

import RequestsAdminPage from "./page";

describe("booking requests admin page", () => {
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
      { id: "user-reception-1", name: "Recepción", email: "recepcion@wakaya.local", active: true },
    ]);
    listOperationsWorkbenchItemsMock.mockResolvedValue([
      {
        id: "request-1",
        publicRef: "WR-2026-0001",
        guestName: "Ada Lovelace",
        guestEmail: "ada@example.com",
        status: "proof_received",
        lane: "proof_received",
        needsReply: false,
        latestCustomerMessageAt: "2026-07-01T10:00:00.000Z",
        latestTeamMessageAt: "2026-07-01T09:05:00.000Z",
        lastSnippet: "Adjunto comprobante",
        ownerUserId: "user-reception-1",
        ownerAssignedAt: "2026-07-01T09:10:00.000Z",
        ownerName: "user-reception-1",
        hasConflict: false,
        syncHealth: "synced",
        requestedCheckIn: "2026-07-10",
        requestedCheckOut: "2026-07-12",
        requestedGuests: 2,
        requestedBungalowType: "bungalow-suite",
        updatedAt: "2026-07-01T10:00:00.000Z",
      },
    ]);
    getOperationThreadViewMock.mockResolvedValue({
      bookingRequest: { id: "request-1", ownerUserId: "user-reception-1" },
      thread: null,
      messages: [],
      attachments: [],
      conflicts: [],
      workItem: { id: "request-1" },
    });
    listQuickReplyTemplatesMock.mockResolvedValue([{ id: "template-1", label: "Seguimiento" }]);
    listBungalowsMock.mockResolvedValue([]);
  });

  it("hydrates the workbench with queue, selected detail, owners and templates", async () => {
    const html = renderToStaticMarkup(
      await RequestsAdminPage({ searchParams: { selected: "request-1" } }),
    );

    expect(listOperationsWorkbenchItemsMock).toHaveBeenCalledWith({
      lane: undefined,
      ownerUserId: undefined,
      query: undefined,
    });
    expect(getOperationThreadViewMock).toHaveBeenCalledWith("request-1");
    expect(html).toContain("workbench");
    expect(html).toContain("WR-2026-0001");
    expect(html).toContain("Recepción");
    expect(html).toContain("Seguimiento");
  });

  it("redirects to the canonical selected id when the query is missing or points to a hidden request", async () => {
    await expect(RequestsAdminPage({ searchParams: {} })).rejects.toThrow(
      "NEXT_REDIRECT:/admin/reservations/requests?selected=request-1",
    );
    await expect(
      RequestsAdminPage({ searchParams: { selected: "request-missing", lane: "proof_received" } }),
    ).rejects.toThrow("NEXT_REDIRECT:/admin/reservations/requests?selected=request-1&lane=proof_received");
  });
});
