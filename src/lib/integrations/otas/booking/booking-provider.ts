import { createHash } from "node:crypto";

import { XMLParser } from "fast-xml-parser";

import type {
  OtaConnection,
  OtaReservationImportInput,
  OtaReservationSyncResult,
} from "@/lib/reservations/types";

import type { OtaProvider, OtaProviderRuntime, OtaSyncMode } from "../provider-types";

type BookingReservationEnvelope = {
  externalReservationId: string;
  externalPropertyId: string | null;
  externalRoomTypeCode: string | null;
  externalRatePlanCode: string | null;
  providerStatus: string | null;
  guestName: string;
  guestEmail: string;
  guestPhone: string | null;
  guestCount: number | null;
  startDate: string;
  endDate: string;
  amountTotalCents: number | undefined;
  rawPayload: Record<string, unknown>;
};

const bookingXmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  trimValues: true,
  parseTagValue: false,
  parseAttributeValue: false,
});

function isoNow() {
  return new Date().toISOString();
}

function getBookingApiBaseUrl() {
  const value = process.env.BOOKING_API_BASE_URL?.trim();
  if (!value) {
    throw new Error("booking_api_not_configured");
  }
  return value.replace(/\/+$/, "");
}

function getBookingAuthHeader() {
  const username = process.env.BOOKING_API_USERNAME?.trim();
  const password = process.env.BOOKING_API_PASSWORD?.trim();
  if (!username || !password) {
    throw new Error("booking_api_not_configured");
  }
  return `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;
}

function asArray<T>(value: T | T[] | null | undefined): T[] {
  if (Array.isArray(value)) return value;
  return value == null ? [] : [value];
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function readString(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

function readNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function readPersonName(personName: Record<string, unknown> | null) {
  const given = readString(personName?.GivenName);
  const surname = readString(personName?.Surname);
  return [given, surname].filter(Boolean).join(" ").trim() || "Reserva OTA";
}

function readGuestCount(reservation: Record<string, unknown>) {
  const roomStay = asRecord(asArray(asRecord(reservation.RoomStays)?.RoomStay)[0]);
  const roomGuestCount = asRecord(asArray(asRecord(roomStay?.GuestCounts)?.GuestCount)[0]);
  const globalGuestCount = asRecord(asArray(asRecord(asRecord(reservation.ResGlobalInfo)?.GuestCounts)?.GuestCount)[0]);
  return readNumber(roomGuestCount?.Count) ?? readNumber(globalGuestCount?.Count);
}

function computePayloadChecksum(payload: Record<string, unknown>) {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

function extractReservationId(reservation: Record<string, unknown>) {
  const uniqueId = asRecord(reservation.UniqueID);
  const globalIds = asArray(asRecord(asRecord(reservation.ResGlobalInfo)?.HotelReservationIDs)?.HotelReservationID)
    .map((item) => asRecord(item))
    .filter(Boolean);
  return (
    readString(uniqueId?.ID) ??
    globalIds.map((item) => readString(item?.ResID_Value)).find(Boolean) ??
    null
  );
}

function parseBookingReservation(reservation: Record<string, unknown>, externalPropertyId: string | null): BookingReservationEnvelope | null {
  const reservationId = extractReservationId(reservation);
  const resGlobalInfo = asRecord(reservation.ResGlobalInfo);
  const timeSpan = asRecord(resGlobalInfo?.TimeSpan);
  const roomStay = asRecord(asArray(asRecord(reservation.RoomStays)?.RoomStay)[0]);
  const roomType = asRecord(asArray(asRecord(roomStay?.RoomTypes)?.RoomType)[0]);
  const ratePlan = asRecord(asArray(asRecord(roomStay?.RatePlans)?.RatePlan)[0]);
  const profileInfo = asRecord(asArray(asRecord(resGlobalInfo?.Profiles)?.ProfileInfo)[0]);
  const profile = asRecord(profileInfo?.Profile);
  const customer = asRecord(profile?.Customer);
  const total = asRecord(resGlobalInfo?.Total);
  const telephone = asRecord(customer?.Telephone);
  const personName = asRecord(customer?.PersonName);

  const startDate = readString(timeSpan?.Start);
  const endDate = readString(timeSpan?.End);
  if (!reservationId || !startDate || !endDate) {
    return null;
  }

  return {
    externalReservationId: reservationId,
    externalPropertyId,
    externalRoomTypeCode: readString(roomType?.RoomTypeCode),
    externalRatePlanCode: readString(ratePlan?.RatePlanCode),
    providerStatus: readString(reservation.ResStatus),
    guestName: readPersonName(personName),
    guestEmail: readString(customer?.Email) ?? "sin-correo@ota.invalid",
    guestPhone: readString(telephone?.PhoneNumber),
    guestCount: readGuestCount(reservation),
    startDate,
    endDate,
    amountTotalCents: readNumber(total?.AmountAfterTax) ?? undefined,
    rawPayload: reservation,
  };
}

function normalizeBookingXmlReservations(xml: string, externalPropertyId: string | null) {
  const parsed = bookingXmlParser.parse(xml) as Record<string, unknown>;
  const root =
    asRecord(parsed.OTA_HotelResNotifRS) ??
    asRecord(parsed.OTA_HotelResNotifRQ) ??
    {};
  const hotelReservations = asRecord(root.HotelReservations);
  const reservations = asArray(hotelReservations?.HotelReservation)
    .map((item) => asRecord(item))
    .filter((item): item is Record<string, unknown> => item !== null)
    .map((item) => parseBookingReservation(item, externalPropertyId))
    .filter((item): item is BookingReservationEnvelope => item !== null);
  return reservations;
}

function normalizeRecoveryReservations(payload: Record<string, unknown>) {
  return asArray(payload.data)
    .map((item) => asRecord(item))
    .filter((item): item is Record<string, unknown> => item !== null)
    .map((item) => {
      const reservationId = readString(item.reservation_id);
      const startDate = readString(item.arrival_date);
      const endDate = readString(item.departure_date);
      if (!reservationId || !startDate || !endDate) {
        return null;
      }

      return {
        externalReservationId: reservationId,
        externalPropertyId: readString(item.hotel_id),
        externalRoomTypeCode: readString(item.room_type_code),
        externalRatePlanCode: readString(item.rate_plan_code),
        providerStatus: readString(item.status),
        guestName: readString(item.guest_name) ?? "Reserva OTA",
        guestEmail: readString(item.guest_email) ?? "sin-correo@ota.invalid",
        guestPhone: readString(item.guest_phone),
        guestCount: readNumber(item.guest_count),
        startDate,
        endDate,
        amountTotalCents: readNumber(item.amount_total_cents) ?? undefined,
        rawPayload: item ?? {},
      } satisfies BookingReservationEnvelope;
    })
    .filter((item): item is BookingReservationEnvelope => item !== null);
}

async function fetchBookingReservations(connection: OtaConnection, mode: OtaSyncMode) {
  const url =
    mode === "incremental"
      ? `${getBookingApiBaseUrl()}/ota/OTA_HotelResNotif?hotel_id=${encodeURIComponent(connection.externalPropertyId ?? "")}`
      : `${getBookingApiBaseUrl()}/reservations-flow-control/missed-reservations?hotel_id=${encodeURIComponent(connection.externalPropertyId ?? "")}`;
  const accept = mode === "incremental" ? "application/xml" : "application/json";
  const response = await fetch(url, {
    method: "GET",
    headers: {
      accept,
      authorization: getBookingAuthHeader(),
    },
  });

  if (!response.ok) {
    throw new Error("booking_sync_failed");
  }

  return mode === "incremental"
    ? normalizeBookingXmlReservations(await response.text(), connection.externalPropertyId)
    : normalizeRecoveryReservations((await response.json()) as Record<string, unknown>);
}

async function acknowledgeReservations(connection: OtaConnection, reservationIds: string[]) {
  if (reservationIds.length === 0) {
    return;
  }

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<OTA_HotelResNotifRQ>
  <Success/>
  <HotelReservations>
    ${reservationIds
      .map(
        (id) => `<HotelReservation><UniqueID Type="14" ID="${id}" HotelCode="${connection.externalPropertyId ?? ""}" /></HotelReservation>`,
      )
      .join("")}
  </HotelReservations>
</OTA_HotelResNotifRQ>`;

  const response = await fetch(`${getBookingApiBaseUrl()}/ota/OTA_HotelResNotif`, {
    method: "POST",
    headers: {
      "content-type": "application/xml",
      accept: "application/xml",
      authorization: getBookingAuthHeader(),
    },
    body,
  });

  if (!response.ok) {
    throw new Error("booking_ack_failed");
  }
}

export function buildBookingProvider(runtime: OtaProviderRuntime): OtaProvider {
  const runSync = async ({
    connection,
    mode,
  }: {
    connection: OtaConnection;
    mode: OtaSyncMode;
  }): Promise<OtaReservationSyncResult> => {
    const startedAt = isoNow();
    await runtime.logSyncRun({
      connectionId: connection.id,
      providerKey: "booking_com",
      mode,
      status: "running",
      summary: {},
      startedAt,
    });

    try {
      const providerReservations = await fetchBookingReservations(connection, mode);
      let imported = 0;
      let acknowledged = 0;
      let skipped = 0;
      let pendingMapping = 0;
      let conflicts = 0;
      const acknowledgedIds: string[] = [];

      for (const reservation of providerReservations) {
        const payload: OtaReservationImportInput = {
          connectionId: connection.id,
          sourceProvider: "booking_com",
          externalReservationId: reservation.externalReservationId,
          externalPropertyId: reservation.externalPropertyId,
          externalRoomTypeCode: reservation.externalRoomTypeCode,
          externalRatePlanCode: reservation.externalRatePlanCode,
          providerStatus: reservation.providerStatus,
          providerPayloadChecksum: computePayloadChecksum(reservation.rawPayload),
          providerLastEventAt: startedAt,
          guestName: reservation.guestName,
          guestEmail: reservation.guestEmail,
          guestPhone: reservation.guestPhone,
          guestCount: reservation.guestCount,
          startDate: reservation.startDate,
          endDate: reservation.endDate,
          amountTotalCents: reservation.amountTotalCents,
          rawPayload: reservation.rawPayload,
        };

        const result = await runtime.importReservation(payload);
        imported += result.created || result.updated ? 1 : 0;
        skipped += result.created || result.updated ? 0 : 1;
        pendingMapping += result.pendingMapping ? 1 : 0;
        conflicts += result.conflictIds.length;
        if (mode === "incremental" && result.occupancyBlocked && !result.pendingMapping) {
          acknowledgedIds.push(reservation.externalReservationId);
        }
      }

      if (mode === "incremental" && acknowledgedIds.length > 0) {
        await acknowledgeReservations(connection, acknowledgedIds);
        acknowledged = acknowledgedIds.length;
      }

      const finishedAt = isoNow();
      const summary = { imported, acknowledged, skipped, pendingMapping, conflicts, failures: 0 };
      await runtime.logSyncRun({
        connectionId: connection.id,
        providerKey: "booking_com",
        mode,
        status: "completed",
        summary,
        startedAt,
        finishedAt,
      });

      return {
        providerKey: "booking_com",
        mode,
        ...summary,
        startedAt,
        finishedAt,
      } satisfies OtaReservationSyncResult;
    } catch (error) {
      const finishedAt = isoNow();
      await runtime.logSyncRun({
        connectionId: connection.id,
        providerKey: "booking_com",
        mode,
        status: "failed",
        summary: {},
        errorMessage: error instanceof Error ? error.message : "booking_sync_failed",
        startedAt,
        finishedAt,
      });
      throw error;
    }
  };

  return {
    key: "booking_com",
    capabilities: {
      reservationFeed: {
        pullReservations: ({ connection }) => runSync({ connection, mode: "incremental" }),
      },
      reservationAcknowledge: {
        acknowledgeReservations: ({ connection, reservationIds }) => acknowledgeReservations(connection, reservationIds),
      },
      reservationRecovery: {
        recoverReservations: ({ connection }) => runSync({ connection, mode: "recovery" }),
      },
      guestMessaging: {
        conversationProvider: "booking_messaging",
      },
      inventorySync: {
        syncInventory: async () => {
          throw new Error("ota_inventory_sync_disabled");
        },
      },
    },
    syncReservations: runSync,
  };
}
