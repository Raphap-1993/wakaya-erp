import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { OtaConnection, OtaReservationImportResult, OtaReservationSyncResult } from "@/lib/reservations/types";

import { buildBookingProvider } from "./booking-provider";

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

function createConnection(overrides: Partial<OtaConnection> = {}): OtaConnection {
  return {
    id: "connection-booking-1",
    providerKey: "booking_com",
    accountLabel: "Booking Wakaya",
    externalPropertyId: "5571744",
    isActive: true,
    messagesEnabled: true,
    ariEnabled: false,
    recoveryEnabled: true,
    metadata: {},
    createdAt: "2026-07-09T20:00:00.000Z",
    updatedAt: "2026-07-09T20:00:00.000Z",
    ...overrides,
  };
}

const xmlReservationsPayload = `<?xml version="1.0" encoding="UTF-8"?>
<OTA_HotelResNotifRS>
  <HotelReservations>
    <HotelReservation ResStatus="Book">
      <UniqueID Type="14" ID="booking-res-1" />
      <ResGlobalInfo>
        <HotelReservationIDs>
          <HotelReservationID ResID_Type="14" ResID_Value="booking-res-1" />
        </HotelReservationIDs>
        <Profiles>
          <ProfileInfo>
            <Profile ProfileType="1">
              <Customer>
                <PersonName>
                  <GivenName>Ada</GivenName>
                  <Surname>Lovelace</Surname>
                </PersonName>
                <Email>ada@example.com</Email>
                <Telephone PhoneNumber="+51987654321" />
              </Customer>
            </Profile>
          </ProfileInfo>
        </Profiles>
        <TimeSpan Start="2026-07-20" End="2026-07-22" />
        <Total AmountAfterTax="56000" CurrencyCode="PEN" />
      </ResGlobalInfo>
      <RoomStays>
        <RoomStay>
          <RoomTypes>
            <RoomType RoomTypeCode="SUITE" />
          </RoomTypes>
          <RatePlans>
            <RatePlan RatePlanCode="BAR" />
          </RatePlans>
        </RoomStay>
      </RoomStays>
    </HotelReservation>
  </HotelReservations>
</OTA_HotelResNotifRS>`;

describe("booking ota provider", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    process.env.BOOKING_API_BASE_URL = "https://booking.test/connectivity";
    process.env.BOOKING_API_USERNAME = "booking-user";
    process.env.BOOKING_API_PASSWORD = "booking-password";
  });

  afterEach(() => {
    delete process.env.BOOKING_API_BASE_URL;
    delete process.env.BOOKING_API_USERNAME;
    delete process.env.BOOKING_API_PASSWORD;
  });

  it("imports new reservations and acknowledges them only after persistence succeeds", async () => {
    const imports: Array<Record<string, unknown>> = [];
    const acknowledgeCalls: string[] = [];

    fetchMock
      .mockResolvedValueOnce(
        new Response(xmlReservationsPayload, {
          status: 200,
          headers: { "content-type": "application/xml" },
        }),
      )
      .mockImplementationOnce(async (_input, init) => {
        acknowledgeCalls.push(String(init?.body ?? ""));
        return new Response("<ok />", {
          status: 200,
          headers: { "content-type": "application/xml" },
        });
      });

    const provider = buildBookingProvider({
      importReservation: vi.fn(async (input): Promise<OtaReservationImportResult> => {
        imports.push(input as unknown as Record<string, unknown>);
        return {
          reservationId: "reservation-1",
          reservationNumber: "RESERVATION-2026-0010",
          bungalowTypeId: "bungalow-suite",
          bungalowUnitId: "unit_dob_01",
          inventoryStatus: "assigned",
          availabilityConflictId: null,
          idempotentReplay: false,
          created: true,
          updated: false,
          occupancyBlocked: true,
          conflictIds: [],
          pendingMapping: false,
          acknowledgedExternally: false,
        };
      }),
      logSyncRun: vi.fn(async () => {}),
    });

    const result = await provider.syncReservations({
      connection: createConnection(),
      mode: "incremental",
    });

    expect(result).toMatchObject({
      providerKey: "booking_com",
      mode: "incremental",
      imported: 1,
      acknowledged: 1,
      skipped: 0,
      pendingMapping: 0,
      conflicts: 0,
      failures: 0,
    });
    expect(imports).toHaveLength(1);
    expect(imports[0]).toMatchObject({
      sourceProvider: "booking_com",
      externalReservationId: "booking-res-1",
      externalPropertyId: "5571744",
      externalRoomTypeCode: "SUITE",
      externalRatePlanCode: "BAR",
      guestName: "Ada Lovelace",
      guestEmail: "ada@example.com",
      guestPhone: "+51987654321",
      startDate: "2026-07-20",
      endDate: "2026-07-22",
    });
    expect(acknowledgeCalls).toHaveLength(1);
    expect(acknowledgeCalls[0]).toContain("booking-res-1");
  });

  it("can execute recovery without acknowledging imported rows twice", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          data: [
            {
              reservation_id: "booking-res-2",
              hotel_id: "5571744",
              guest_name: "Grace Hopper",
              guest_email: "grace@example.com",
              arrival_date: "2026-07-24",
              departure_date: "2026-07-26",
              room_type_code: "FAMILY",
              rate_plan_code: "BAR",
              status: "booked",
              updated_at: "2026-07-09T22:00:00Z",
            },
          ],
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      ),
    );

    const importReservation = vi.fn(async (): Promise<OtaReservationImportResult> => ({
      reservationId: "reservation-2",
      reservationNumber: "RESERVATION-2026-0011",
      bungalowTypeId: "bungalow-family",
      bungalowUnitId: "unit_fam_01",
      inventoryStatus: "assigned",
      availabilityConflictId: null,
      idempotentReplay: false,
      created: true,
      updated: false,
      occupancyBlocked: true,
      conflictIds: [],
      pendingMapping: false,
      acknowledgedExternally: false,
    }));
    const provider = buildBookingProvider({
      importReservation,
      logSyncRun: vi.fn(async () => {}),
    });

    const result = await provider.syncReservations({
      connection: createConnection(),
      mode: "recovery",
    });

    expect(result.imported).toBe(1);
    expect(result.acknowledged).toBe(0);
    expect(importReservation).toHaveBeenCalledTimes(1);
  });
});
