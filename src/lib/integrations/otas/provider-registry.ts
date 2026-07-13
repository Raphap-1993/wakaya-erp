import { buildBookingProvider } from "./booking/booking-provider";
import type { OtaProvider, OtaProviderRuntime } from "./provider-types";

export function createOtaProviders(runtime: OtaProviderRuntime): OtaProvider[] {
  return [buildBookingProvider(runtime)];
}

export function getOtaProvider(key: OtaProvider["key"], runtime?: OtaProviderRuntime): OtaProvider {
  const providers = runtime
    ? createOtaProviders(runtime)
    : createOtaProviders({
        importReservation: async () => {
          throw new Error("ota_runtime_not_bound");
        },
        logSyncRun: async () => {},
      });
  const provider = providers.find((item) => item.key === key);
  if (!provider) {
    throw new Error("ota_provider_not_supported");
  }
  return provider;
}

export function listOtaProviders(runtime?: OtaProviderRuntime): OtaProvider[] {
  return runtime
    ? createOtaProviders(runtime)
    : createOtaProviders({
        importReservation: async () => {
          throw new Error("ota_runtime_not_bound");
        },
        logSyncRun: async () => {},
      });
}
