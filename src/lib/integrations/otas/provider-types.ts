import type {
  ConversationProvider,
  OtaConnection,
  OtaReservationImportInput,
  OtaReservationImportResult,
  OtaReservationSyncResult,
} from "@/lib/reservations/types";

export type OtaProviderKey = OtaConnection["providerKey"];

export type OtaSyncMode = "incremental" | "recovery";

export interface ReservationFeedCapability {
  pullReservations(input: {
    connection: OtaConnection;
  }): Promise<OtaReservationSyncResult>;
}

export interface ReservationAcknowledgeCapability {
  acknowledgeReservations(input: {
    connection: OtaConnection;
    reservationIds: string[];
  }): Promise<void>;
}

export interface ReservationRecoveryCapability {
  recoverReservations(input: {
    connection: OtaConnection;
  }): Promise<OtaReservationSyncResult>;
}

export interface GuestMessagingCapability {
  conversationProvider: ConversationProvider;
}

export interface InventorySyncCapability {
  syncInventory(input: {
    connection: OtaConnection;
  }): Promise<void>;
}

export type OtaProviderCapabilities = {
  reservationFeed?: ReservationFeedCapability;
  reservationAcknowledge?: ReservationAcknowledgeCapability;
  reservationRecovery?: ReservationRecoveryCapability;
  guestMessaging?: GuestMessagingCapability;
  inventorySync?: InventorySyncCapability;
};

export interface OtaProviderRuntime {
  importReservation(input: OtaReservationImportInput): Promise<OtaReservationImportResult>;
  logSyncRun(input: {
    connectionId: string | null;
    providerKey: OtaProviderKey;
    mode: OtaSyncMode;
    status: "running" | "completed" | "failed";
    summary: Record<string, unknown>;
    errorMessage?: string | null;
    startedAt: string;
    finishedAt?: string | null;
  }): Promise<void>;
}

export interface OtaProvider {
  key: OtaProviderKey;
  capabilities: OtaProviderCapabilities;
  syncReservations(input: {
    connection: OtaConnection;
    mode: OtaSyncMode;
  }): Promise<OtaReservationSyncResult>;
}
