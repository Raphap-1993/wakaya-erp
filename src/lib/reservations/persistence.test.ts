import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { resetZohoTokenCacheForTests } from "@/lib/mail/zoho-client";
import { buildReservationService } from "@/lib/reservations/service";
import { createFallbackReservationService, ReservationStore } from "@/lib/reservations/store";

const mutableEnv = process.env as Record<string, string | undefined>;

beforeEach(() => {
  resetZohoTokenCacheForTests();
  vi.unstubAllGlobals();
});

describe("reservation service boot", () => {
  it("fails fast when the operational database url is missing", () => {
    const restore = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;

    try {
      expect(() => buildReservationService()).toThrow("database_url_missing");
    } finally {
      if (restore) {
        process.env.DATABASE_URL = restore;
      }
    }
  });
});

describe("reservation store memory persistence", () => {
  it("seeds the operational bungalow catalog in fallback mode outside tests", async () => {
    const dir = mkdtempSync(join(tmpdir(), "wakaya-fallback-bungalows-"));
    const storagePath = join(dir, "fallback.snapshot.json");
    const restoreNodeEnv = process.env.NODE_ENV;
    const restoreStoragePath = process.env.WAKAYA_RESERVATIONS_DB_PATH;
    const restoreBootstrapFlag = process.env.WAKAYA_BOOTSTRAP_FALLBACK_DATA;

    mutableEnv.NODE_ENV = "production";
    mutableEnv.WAKAYA_RESERVATIONS_DB_PATH = storagePath;
    delete mutableEnv.WAKAYA_BOOTSTRAP_FALLBACK_DATA;

    try {
      const service = createFallbackReservationService();
      const bungalows = await service.listBungalows();

      expect(bungalows).toHaveLength(5);
      expect(bungalows.map((item) => item.code)).toEqual([
        "SUITE",
        "FAMILY",
        "INDIVIDUAL",
        "MATRIMONIAL",
        "TRIPLE",
      ]);
    } finally {
      if (restoreNodeEnv) {
        mutableEnv.NODE_ENV = restoreNodeEnv;
      } else {
        delete mutableEnv.NODE_ENV;
      }
      if (restoreStoragePath) {
        mutableEnv.WAKAYA_RESERVATIONS_DB_PATH = restoreStoragePath;
      } else {
        delete mutableEnv.WAKAYA_RESERVATIONS_DB_PATH;
      }
      if (restoreBootstrapFlag) {
        mutableEnv.WAKAYA_BOOTSTRAP_FALLBACK_DATA = restoreBootstrapFlag;
      } else {
        delete mutableEnv.WAKAYA_BOOTSTRAP_FALLBACK_DATA;
      }
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("can bootstrap demo reservations and booking requests in fallback mode when requested", async () => {
    const dir = mkdtempSync(join(tmpdir(), "wakaya-fallback-demo-"));
    const storagePath = join(dir, "demo.snapshot.json");
    const restoreNodeEnv = process.env.NODE_ENV;
    const restoreStoragePath = process.env.WAKAYA_RESERVATIONS_DB_PATH;
    const restoreBootstrapFlag = process.env.WAKAYA_BOOTSTRAP_FALLBACK_DATA;

    mutableEnv.NODE_ENV = "production";
    mutableEnv.WAKAYA_RESERVATIONS_DB_PATH = storagePath;
    mutableEnv.WAKAYA_BOOTSTRAP_FALLBACK_DATA = "true";

    try {
      const service = createFallbackReservationService();
      const reservations = await service.list();
      const bookingRequests = await service.listBookingRequests();

      expect(reservations.length).toBeGreaterThan(0);
      expect(bookingRequests.length).toBeGreaterThan(0);
    } finally {
      if (restoreNodeEnv) {
        mutableEnv.NODE_ENV = restoreNodeEnv;
      } else {
        delete mutableEnv.NODE_ENV;
      }
      if (restoreStoragePath) {
        mutableEnv.WAKAYA_RESERVATIONS_DB_PATH = restoreStoragePath;
      } else {
        delete mutableEnv.WAKAYA_RESERVATIONS_DB_PATH;
      }
      if (restoreBootstrapFlag) {
        mutableEnv.WAKAYA_BOOTSTRAP_FALLBACK_DATA = restoreBootstrapFlag;
      } else {
        delete mutableEnv.WAKAYA_BOOTSTRAP_FALLBACK_DATA;
      }
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("persists reservations across store instances when a storage path is provided", () => {
    const dir = mkdtempSync(join(tmpdir(), "wakaya-reservations-"));
    const storagePath = join(dir, "reservations.snapshot");

    try {
      const first = new ReservationStore({ storagePath });
      const created = first.create({
        number: "RESERVATION-2026-0200",
        channel: "web",
        bungalowId: "bungalow-family",
        actorId: "user-reception-1",
        responsibleId: "user-reception-1",
        startDate: "2026-08-10",
        endDate: "2026-08-12",
      });

      const second = new ReservationStore({ storagePath });
      expect(second.get(created.reservation.id)?.number).toBe("RESERVATION-2026-0200");
      expect(second.getAuditTrail(created.reservation.id)).toHaveLength(1);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("persists booking requests across fallback service instances when a storage path is provided", async () => {
    const dir = mkdtempSync(join(tmpdir(), "wakaya-booking-requests-"));
    const storagePath = join(dir, "booking-requests.snapshot");
    const restoreStoragePath = process.env.WAKAYA_RESERVATIONS_DB_PATH;

    mutableEnv.WAKAYA_RESERVATIONS_DB_PATH = storagePath;

    try {
      const first = createFallbackReservationService();
      const created = await first.createBookingRequest({
        guestName: "Ada Lovelace",
        guestEmail: "ada@example.com",
        guestPhone: "+51987654321",
        requestedCheckIn: "2026-08-10",
        requestedCheckOut: "2026-08-12",
        requestedGuests: 4,
        requestedBungalowType: "bungalow-family",
      });

      const second = createFallbackReservationService();
      const bookingRequests = await second.listBookingRequests();

      expect(
        bookingRequests.find((item) => item.id === created.bookingRequest.id)?.publicRef,
      ).toBe(created.bookingRequest.publicRef);
    } finally {
      if (restoreStoragePath) {
        mutableEnv.WAKAYA_RESERVATIONS_DB_PATH = restoreStoragePath;
      } else {
        delete mutableEnv.WAKAYA_RESERVATIONS_DB_PATH;
      }
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("can send the first ERP reply for a booking request without prior synced messages", async () => {
    const dir = mkdtempSync(join(tmpdir(), "wakaya-booking-reply-"));
    const storagePath = join(dir, "booking-reply.snapshot");
    const restoreStoragePath = process.env.WAKAYA_RESERVATIONS_DB_PATH;
    const restoreAccountId = process.env.ZOHO_MAIL_ACCOUNT_ID;
    const restoreAccessToken = process.env.ZOHO_MAIL_ACCESS_TOKEN;

    mutableEnv.WAKAYA_RESERVATIONS_DB_PATH = storagePath;
    mutableEnv.ZOHO_MAIL_ACCOUNT_ID = "zoho-account";
    mutableEnv.ZOHO_MAIL_ACCESS_TOKEN = "zoho-token";

    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: [],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: {
              messageId: "zoho-first-reply-1",
              threadId: "zoho-thread-first-reply",
              sentTime: "2026-08-01T12:00:00.000Z",
            },
          }),
        }),
    );

    try {
      const service = createFallbackReservationService();
      const created = await service.createBookingRequest({
        guestName: "Ada Lovelace",
        guestEmail: "ada@example.com",
        guestPhone: "+51987654321",
        requestedCheckIn: "2026-08-10",
        requestedCheckOut: "2026-08-12",
        requestedGuests: 2,
        requestedBungalowType: "bungalow-family",
      });

      const result = await service.replyToBookingRequestThread(created.bookingRequest.id, {
        actorId: "user-reception-1",
        bodyText: "Hola Ada, iniciamos tu atención desde el ERP.",
      });

      expect(result.reply.providerMessageId).toBe("zoho-first-reply-1");
      expect(result.thread.providerThreadId).toBe("zoho-thread-first-reply");

      const detail = await service.getBookingRequestThreadView(created.bookingRequest.id);
      expect(detail?.messages).toHaveLength(1);
      expect(detail?.messages[0]?.origin).toBe("erp_outbound");
      expect(detail?.messages[0]?.bodyText).toContain("iniciamos tu atención");
    } finally {
      if (restoreStoragePath) {
        mutableEnv.WAKAYA_RESERVATIONS_DB_PATH = restoreStoragePath;
      } else {
        delete mutableEnv.WAKAYA_RESERVATIONS_DB_PATH;
      }
      if (restoreAccountId) {
        mutableEnv.ZOHO_MAIL_ACCOUNT_ID = restoreAccountId;
      } else {
        delete mutableEnv.ZOHO_MAIL_ACCOUNT_ID;
      }
      if (restoreAccessToken) {
        mutableEnv.ZOHO_MAIL_ACCESS_TOKEN = restoreAccessToken;
      } else {
        delete mutableEnv.ZOHO_MAIL_ACCESS_TOKEN;
      }
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("persists complaints across fallback service instances when a storage path is provided", async () => {
    const dir = mkdtempSync(join(tmpdir(), "wakaya-complaints-"));
    const storagePath = join(dir, "complaints.snapshot");
    const restoreStoragePath = process.env.WAKAYA_RESERVATIONS_DB_PATH;

    mutableEnv.WAKAYA_RESERVATIONS_DB_PATH = storagePath;

    try {
      const first = createFallbackReservationService();
      const created = await first.createComplaint({
        type: "reclamo",
        fullName: "Ada Lovelace",
        documentType: "dni",
        documentNumber: "12345678",
        email: "ada@example.com",
        phone: "+51987654321",
        address: "Jr. Ucayali 123, Pucallpa",
        serviceType: "lodging",
        contractedService: "Estadia en bungalow matrimonial",
        complaintDetail: "La habitacion no estuvo lista al llegar.",
        consumerRequest: "Solicito una respuesta formal y compensacion.",
        acceptedDeclaration: true,
      });

      const second = createFallbackReservationService();
      const complaints = await second.listComplaints();

      expect(complaints.find((item) => item.id === created.complaint.id)?.publicCode).toBe(
        created.complaint.publicCode,
      );
    } finally {
      if (restoreStoragePath) {
        mutableEnv.WAKAYA_RESERVATIONS_DB_PATH = restoreStoragePath;
      } else {
        delete mutableEnv.WAKAYA_RESERVATIONS_DB_PATH;
      }
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("persists bungalow public content across store instances when a storage path is provided", () => {
    const dir = mkdtempSync(join(tmpdir(), "wakaya-bungalow-public-"));
    const storagePath = join(dir, "bungalow-public.snapshot");

    try {
      const first = new ReservationStore({ storagePath });
      first.updateBungalowPublicContent("bungalow-family", {
        featuredOnHome: true,
        sortOrder: 1,
        heroImageUrl: "https://cdn.wakaya.test/bungalows/familiar/hero.jpg",
        galleryUrls: [
          "https://cdn.wakaya.test/bungalows/familiar/gallery-1.jpg",
          "https://cdn.wakaya.test/bungalows/familiar/gallery-2.jpg",
        ],
        nightlyRatePen: 350,
        areaSqm: 55,
        localeContent: {
          es: {
            displayName: "Bungalow Familiar",
            displayEyebrow: "Wakaya Ecolodge · Pucallpa",
            displayDescription: "Dos habitaciones independientes y terraza amplia.",
            displayTagline: "El bungalow ideal para familias",
            displayLongDescription: "Una categoría amplia para familias con niños y estadías largas.",
            displayHighlights: ["Dos dormitorios", "Vista a piscina"],
            displayAmenities: ["WiFi", "Aire acondicionado"],
            displayIncluded: ["Desayuno", "Toallas"],
          },
          en: {
            displayName: "Family Bungalow",
            displayEyebrow: "Wakaya Ecolodge · Pucallpa",
            displayDescription: "Two separate bedrooms and a wide terrace.",
            displayTagline: "The ideal bungalow for families",
            displayLongDescription: "A spacious category for families and longer stays.",
            displayHighlights: ["Two bedrooms", "Pool view"],
            displayAmenities: ["WiFi", "Air conditioning"],
            displayIncluded: ["Breakfast", "Towels"],
          },
        },
      });

      const second = new ReservationStore({ storagePath });
      const persisted = second.getBungalowPublicContent("bungalow-family");

      expect(persisted?.heroImageUrl).toBe("https://cdn.wakaya.test/bungalows/familiar/hero.jpg");
      expect(persisted?.localeContent.es.displayTagline).toBe("El bungalow ideal para familias");
      expect(persisted?.galleryUrls).toHaveLength(2);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("tolerates legacy fallback snapshots that only persisted booking requests", async () => {
    const dir = mkdtempSync(join(tmpdir(), "wakaya-booking-legacy-"));
    const storagePath = join(dir, "legacy-booking-requests.snapshot.json");
    const restoreStoragePath = process.env.WAKAYA_RESERVATIONS_DB_PATH;

    process.env.WAKAYA_RESERVATIONS_DB_PATH = storagePath;
    writeFileSync(
      storagePath,
      JSON.stringify({
        bookingRequests: {
          bookingRequests: [
            {
              id: "request-legacy-1",
              publicRef: "WR-2026-0010",
              status: "proof_received",
              guestName: "Ada Lovelace",
              guestEmail: "ada@example.com",
              guestPhone: "+51987654321",
              requestedCheckIn: "2026-08-10",
              requestedCheckOut: "2026-08-12",
              requestedGuests: 2,
              requestedBungalowType: "bungalow-suite",
              sourceChannel: "web_public",
              threadId: null,
              threadKey: "booking-request:WR-2026-0010",
              notes: null,
              lastMessageAt: null,
              syncStatus: "pending",
              createdAt: "2026-07-01T09:00:00.000Z",
              updatedAt: "2026-07-01T09:10:00.000Z",
            },
          ],
        },
      }),
      "utf8",
    );

    try {
      const service = createFallbackReservationService();
      await expect(service.listBookingRequests()).resolves.toMatchObject([
        {
          id: "request-legacy-1",
          publicRef: "WR-2026-0010",
        },
      ]);
      await expect(service.listComplaints()).resolves.toEqual([]);
    } finally {
      if (restoreStoragePath) {
        process.env.WAKAYA_RESERVATIONS_DB_PATH = restoreStoragePath;
      } else {
        delete process.env.WAKAYA_RESERVATIONS_DB_PATH;
      }
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
