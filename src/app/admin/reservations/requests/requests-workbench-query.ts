import type { Route } from "next";

import type { OperationsWorkbenchLane } from "@/lib/reservations/types";

export type RequestsWorkbenchSearchParams = {
  selected?: string;
  lane?: string;
  owner?: string;
  query?: string;
};

const VALID_LANES = new Set<OperationsWorkbenchLane>([
  "requires_reply",
  "proof_received",
  "conflict",
  "waiting_customer",
  "pending_mapping",
  "pending_ack",
  "sync_error",
  "closed",
]);

function normalizeString(value?: string): string {
  return value?.trim() ?? "";
}

export function normalizeRequestsWorkbenchQuery(input: RequestsWorkbenchSearchParams) {
  const lane = normalizeString(input.lane);
  return {
    selected: normalizeString(input.selected) || undefined,
    lane: VALID_LANES.has(lane as OperationsWorkbenchLane) ? (lane as OperationsWorkbenchLane) : undefined,
    owner: normalizeString(input.owner) || undefined,
    query: normalizeString(input.query) || undefined,
  };
}

export function buildRequestsWorkbenchHref(input: {
  selected?: string;
  lane?: OperationsWorkbenchLane;
  owner?: string;
  query?: string;
}): Route {
  const params = new URLSearchParams();
  if (input.selected) params.set("selected", input.selected);
  if (input.lane) params.set("lane", input.lane);
  if (input.owner) params.set("owner", input.owner);
  if (input.query) params.set("query", input.query);

  const query = params.toString();
  return (query ? `/admin/reservations/requests?${query}` : "/admin/reservations/requests") as Route;
}
