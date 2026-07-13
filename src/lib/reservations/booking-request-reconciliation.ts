import type { ReservationServiceLike } from "@/lib/reservations/repository";

const RECONCILIATION_FLAG = Symbol.for("wakaya.bookingRequestReconciliation.started");

function shouldStartReconciliation() {
  if (process.env.NODE_ENV === "test") {
    return false;
  }

  return Boolean(process.env.ZOHO_MAIL_ACCOUNT_ID?.trim());
}

export function registerBookingRequestReconciliation(service: ReservationServiceLike) {
  const globalState = globalThis as Record<PropertyKey, unknown>;
  if (!shouldStartReconciliation() || globalState[RECONCILIATION_FLAG]) {
    return;
  }

  let running = false;
  const intervalMs = Math.max(60_000, Number(process.env.ZOHO_RECONCILIATION_INTERVAL_MS ?? 300_000));

  const tick = async () => {
    if (running) {
      return;
    }
    running = true;
    try {
      const items = await service.listBookingRequests();
      for (const item of items) {
        if (item.status === "converted_to_reservation" || item.status === "cancelled") {
          continue;
        }
        if (!item.threadKey) {
          continue;
        }
        try {
          await service.syncBookingRequestThread(item.id);
        } catch {
          // best-effort reconciliation
        }
      }
    } finally {
      running = false;
    }
  };

  globalState[RECONCILIATION_FLAG] = true;
  const timer = setInterval(() => {
    void tick();
  }, intervalMs);
  timer.unref();
}
