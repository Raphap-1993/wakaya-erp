import type { ReservationServiceLike } from "@/lib/reservations/repository";
import { PostgresReservationStore } from "@/lib/reservations/postgres-repository";
import { getPool } from "@/lib/reservations/postgres";

export function buildReservationService(): ReservationServiceLike {
  return new PostgresReservationStore(getPool());
}
