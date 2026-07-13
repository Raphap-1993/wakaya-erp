import { describe, expect, it } from "vitest";

import { getOtaProvider, listOtaProviders } from "./provider-registry";

describe("ota provider registry", () => {
  it("registers booking as the first official OTA provider with capability-driven contracts", () => {
    const provider = getOtaProvider("booking_com");

    expect(provider.key).toBe("booking_com");
    expect(provider.capabilities.reservationFeed).toBeTruthy();
    expect(provider.capabilities.reservationAcknowledge).toBeTruthy();
    expect(provider.capabilities.reservationRecovery).toBeTruthy();
    expect(provider.capabilities.guestMessaging?.conversationProvider).toBe("booking_messaging");
    expect(provider.capabilities.inventorySync).toBeTruthy();
  });

  it("keeps the registry extensible for future OTAs", () => {
    expect(listOtaProviders().map((provider) => provider.key)).toContain("booking_com");
  });
});
