import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { useRouterMock } = vi.hoisted(() => ({
  useRouterMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: useRouterMock,
}));

import { BookingRequestsWorkbench } from "./booking-requests-workbench";

describe("BookingRequestsWorkbench", () => {
  beforeEach(() => {
    useRouterMock.mockReturnValue({
      refresh: vi.fn(),
    });
  });

  it("renders the attachment as a click-to-open action inside the ERP workbench thread", () => {
    const html = renderToStaticMarkup(
      <BookingRequestsWorkbench
        items={[
          {
            kind: "booking_request",
            id: "request-1",
            displayRef: "WR-2026-0001",
            publicRef: "WR-2026-0001",
            reservationNumber: null,
            guestName: "Grace Hopper",
            guestEmail: "grace@example.com",
            status: "proof_received",
            lane: "proof_received",
            needsReply: false,
            latestCustomerMessageAt: "2026-07-06T18:11:39.770Z",
            latestTeamMessageAt: "2026-07-05T18:11:39.770Z",
            lastSnippet: "Adjunto mi comprobante",
            ownerUserId: null,
            ownerAssignedAt: null,
            ownerName: null,
            hasConflict: true,
            syncHealth: "synced",
            sourceProvider: null,
            requestedCheckIn: "2026-07-10",
            requestedCheckOut: "2026-07-12",
            requestedGuests: 2,
            requestedBungalowType: "bungalow-family",
            updatedAt: "2026-07-06T18:11:39.770Z",
          },
        ]}
        selectedDetail={{
          kind: "booking_request",
          bookingRequest: {
            id: "request-1",
            publicRef: "WR-2026-0001",
            status: "proof_received",
            guestName: "Grace Hopper",
            guestEmail: "grace@example.com",
            guestPhone: "+51999111111",
            requestedCheckIn: "2026-07-10",
            requestedCheckOut: "2026-07-12",
            requestedGuests: 2,
            requestedBungalowType: "bungalow-family",
            sourceChannel: "web_public",
            threadId: "thread-1",
            threadKey: "booking-request:WR-2026-0001",
            ownerUserId: null,
            ownerAssignedAt: null,
            notes: null,
            lastMessageAt: "2026-07-06T18:11:39.770Z",
            syncStatus: "synced",
            createdAt: "2026-07-05T18:11:39.770Z",
            updatedAt: "2026-07-06T18:11:39.770Z",
          },
          thread: {
            id: "thread-1",
            mailboxAddress: "reservas@wakayaecolodge.com",
            provider: "zoho_mail",
            providerThreadId: "provider-thread-1",
            threadKey: "booking-request:WR-2026-0001",
            subject: "Solicitud WR-2026-0001",
            linkedEntityType: "booking_request",
            linkedEntityId: "request-1",
            lastSyncedAt: "2026-07-06T18:12:00.000Z",
            syncStatus: "synced",
            createdAt: "2026-07-05T18:11:39.770Z",
            updatedAt: "2026-07-06T18:12:00.000Z",
          },
          messages: [
            {
              id: "message-1",
              threadId: "thread-1",
              direction: "inbound",
              origin: "guest_inbound",
              providerMessageId: "provider-message-1",
              fromAddress: "grace@example.com",
              toAddresses: ["reservas@wakayaecolodge.com"],
              ccAddresses: [],
              subject: "Adjunto comprobante",
              bodyText: "Comparto el pdf.",
              bodyHtml: null,
              sentAt: "2026-07-06T18:11:39.770Z",
              receivedAt: "2026-07-06T18:11:39.770Z",
              ingestedAt: "2026-07-06T18:11:40.000Z",
              createdByUserId: null,
              attachments: [
                {
                  id: "attachment-1",
                  messageId: "message-1",
                  providerAttachmentId: "provider-attachment-1",
                  fileName: "comprobante-grace.pdf",
                  contentType: "application/pdf",
                  fileSizeBytes: 245760,
                  storageKey: "booking-requests/request-1/comprobante-grace.pdf",
                  fileHash: "hash-1",
                  isSupported: true,
                  contentBase64: "ZmFrZQ==",
                  createdAt: "2026-07-06T18:11:40.000Z",
                },
              ],
            },
          ],
          attachments: [
            {
              id: "attachment-1",
              messageId: "message-1",
              providerAttachmentId: "provider-attachment-1",
              fileName: "comprobante-grace.pdf",
              contentType: "application/pdf",
              fileSizeBytes: 245760,
              storageKey: "booking-requests/request-1/comprobante-grace.pdf",
              fileHash: "hash-1",
              isSupported: true,
              contentBase64: "ZmFrZQ==",
              createdAt: "2026-07-06T18:11:40.000Z",
            },
          ],
          conflicts: [],
          reservation: null,
          otaLink: null,
          availableConversationProviders: ["zoho_mail"],
          workItem: {
            kind: "booking_request",
            id: "request-1",
            displayRef: "WR-2026-0001",
            publicRef: "WR-2026-0001",
            reservationNumber: null,
            guestName: "Grace Hopper",
            guestEmail: "grace@example.com",
            status: "proof_received",
            lane: "proof_received",
            needsReply: false,
            latestCustomerMessageAt: "2026-07-06T18:11:39.770Z",
            latestTeamMessageAt: "2026-07-05T18:11:39.770Z",
            lastSnippet: "Adjunto mi comprobante",
            ownerUserId: null,
            ownerAssignedAt: null,
            ownerName: null,
            hasConflict: false,
            syncHealth: "synced",
            sourceProvider: null,
            requestedCheckIn: "2026-07-10",
            requestedCheckOut: "2026-07-12",
            requestedGuests: 2,
            requestedBungalowType: "bungalow-family",
            updatedAt: "2026-07-06T18:11:39.770Z",
          },
        }}
        ownerOptions={[]}
        templates={[]}
        bungalows={[
          { id: "bungalow-family", code: "FAMILY", name: "Bungalow Familiar", active: true, capacity: 4 },
        ]}
        permissions={{ canWrite: true, canAssign: true, canApprove: true }}
        currentUserId="user-1"
        query={{ selected: "request-1" }}
      />,
    );

    expect(html).toContain("comprobante-grace.pdf");
    expect(html).not.toContain("Comprobante visible");
    expect(html).not.toContain("<iframe");
  });

  it("marks the latest guest message as pending reply and avoids raw ISO timestamps in the thread", () => {
    const html = renderToStaticMarkup(
      <BookingRequestsWorkbench
        items={[
          {
            kind: "booking_request",
            id: "request-2",
            displayRef: "WR-2026-0003",
            publicRef: "WR-2026-0003",
            reservationNumber: null,
            guestName: "Hugo",
            guestEmail: "hugo@example.com",
            status: "awaiting_transfer",
            lane: "requires_reply",
            needsReply: true,
            latestCustomerMessageAt: "2026-07-09T21:26:24.480Z",
            latestTeamMessageAt: "2026-07-09T20:20:00.000Z",
            lastSnippet: "gracias me indica la cuenta",
            ownerUserId: null,
            ownerAssignedAt: null,
            ownerName: null,
            hasConflict: false,
            syncHealth: "synced",
            sourceProvider: null,
            requestedCheckIn: "2026-07-14",
            requestedCheckOut: "2026-07-16",
            requestedGuests: 2,
            requestedBungalowType: "bungalow-suite",
            updatedAt: "2026-07-09T21:26:24.480Z",
          },
        ]}
        selectedDetail={{
          kind: "booking_request",
          bookingRequest: {
            id: "request-2",
            publicRef: "WR-2026-0003",
            status: "awaiting_transfer",
            guestName: "Hugo",
            guestEmail: "raphaelparedes2@icloud.com",
            guestPhone: "998906481",
            requestedCheckIn: "2026-07-14",
            requestedCheckOut: "2026-07-16",
            requestedGuests: 2,
            requestedBungalowType: "bungalow-suite",
            sourceChannel: "web_public",
            threadId: "thread-2",
            threadKey: "booking-request:WR-2026-0003",
            ownerUserId: null,
            ownerAssignedAt: null,
            notes: null,
            lastMessageAt: "2026-07-09T21:26:24.480Z",
            syncStatus: "synced",
            createdAt: "2026-07-09T20:20:00.000Z",
            updatedAt: "2026-07-09T21:26:24.480Z",
          },
          thread: {
            id: "thread-2",
            mailboxAddress: "reservas@wakayaecolodge.com",
            provider: "zoho_mail",
            providerThreadId: "provider-thread-2",
            threadKey: "booking-request:WR-2026-0003",
            subject: "Solicitud WR-2026-0003",
            linkedEntityType: "booking_request",
            linkedEntityId: "request-2",
            lastSyncedAt: "2026-07-09T21:27:00.000Z",
            syncStatus: "synced",
            createdAt: "2026-07-09T20:20:00.000Z",
            updatedAt: "2026-07-09T21:27:00.000Z",
          },
          messages: [
            {
              id: "message-2",
              threadId: "thread-2",
              direction: "inbound",
              origin: "guest_inbound",
              providerMessageId: "provider-message-2",
              fromAddress: "raphaelparedes2@icloud.com",
              toAddresses: ["reservas@wakayaecolodge.com"],
              ccAddresses: [],
              subject: "Re: Solicitud WR-2026-0003",
              bodyText: "gracias me indica la cuenta",
              bodyHtml: null,
              sentAt: "2026-07-09T21:26:24.480Z",
              receivedAt: "2026-07-09T21:26:24.480Z",
              ingestedAt: "2026-07-09T21:26:25.000Z",
              createdByUserId: null,
              attachments: [],
            },
          ],
          attachments: [],
          conflicts: [],
          reservation: null,
          otaLink: null,
          availableConversationProviders: ["zoho_mail"],
          workItem: {
            kind: "booking_request",
            id: "request-2",
            displayRef: "WR-2026-0003",
            publicRef: "WR-2026-0003",
            reservationNumber: null,
            guestName: "Hugo",
            guestEmail: "hugo@example.com",
            status: "awaiting_transfer",
            lane: "requires_reply",
            needsReply: true,
            latestCustomerMessageAt: "2026-07-09T21:26:24.480Z",
            latestTeamMessageAt: "2026-07-09T20:20:00.000Z",
            lastSnippet: "gracias me indica la cuenta",
            ownerUserId: null,
            ownerAssignedAt: null,
            ownerName: null,
            hasConflict: false,
            syncHealth: "synced",
            sourceProvider: null,
            requestedCheckIn: "2026-07-14",
            requestedCheckOut: "2026-07-16",
            requestedGuests: 2,
            requestedBungalowType: "bungalow-suite",
            updatedAt: "2026-07-09T21:26:24.480Z",
          },
        }}
        ownerOptions={[]}
        templates={[]}
        bungalows={[
          { id: "bungalow-suite", code: "SUITE", name: "Bungalow Doble", active: true, capacity: 2 },
        ]}
        permissions={{ canWrite: true, canAssign: true, canApprove: true }}
        currentUserId="user-1"
        query={{ selected: "request-2" }}
      />,
    );

    expect(html).toContain("Pendiente de respuesta");
    expect(html).toContain("Mensaje del cliente");
    expect(html).not.toContain("2026-07-09T21:26:24.480Z");
  });
});
