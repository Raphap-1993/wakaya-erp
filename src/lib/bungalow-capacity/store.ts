import type { Pool, PoolClient } from "pg";

import { getPool } from "@/lib/reservations/postgres";

import { assertCapacityCanCoverCommitments } from "./availability";
import { APPROVED_BUNGALOW_CAPACITIES } from "./seed";
import type {
  BungalowCapacityRecord,
  CapacityReservationCommitment,
  UpdateCapacityInput,
} from "./types";

export interface BungalowCapacityStoreLike {
  getCapacity(bungalowId: string): Promise<BungalowCapacityRecord | null>;
  listCapacities(): Promise<BungalowCapacityRecord[]>;
  updateCapacity(bungalowId: string, input: UpdateCapacityInput): Promise<BungalowCapacityRecord>;
}

function now() {
  return new Date().toISOString();
}

class InMemoryBungalowCapacityStore implements BungalowCapacityStoreLike {
  private readonly capacities = new Map<string, BungalowCapacityRecord>();

  constructor() {
    for (const seed of APPROVED_BUNGALOW_CAPACITIES) {
      this.capacities.set(seed.bungalowId, {
        ...seed,
        version: 1,
        updatedBy: null,
        createdAt: "2026-07-12T00:00:00.000Z",
        updatedAt: "2026-07-12T00:00:00.000Z",
      });
    }
  }

  async getCapacity(bungalowId: string) {
    return this.capacities.get(bungalowId) ?? null;
  }

  peekCapacity(bungalowId: string) {
    return this.capacities.get(bungalowId) ?? null;
  }

  async listCapacities() {
    return APPROVED_BUNGALOW_CAPACITIES.map((seed) => this.capacities.get(seed.bungalowId)!).filter(Boolean);
  }

  async updateCapacity(bungalowId: string, input: UpdateCapacityInput) {
    const current = this.capacities.get(bungalowId);
    if (!current) throw new Error("bungalow_capacity_not_found");
    if (input.expectedVersion !== current.version) throw new Error("capacity_version_conflict");
    if (!Number.isInteger(input.totalUnits) || input.totalUnits < 0) throw new Error("invalid_total_units");

    assertCapacityCanCoverCommitments({
      bungalowId,
      proposedTotalUnits: input.totalUnits,
      reservations: input.reservations ?? [],
    });

    const updated: BungalowCapacityRecord = {
      ...current,
      totalUnits: input.totalUnits,
      version: current.version + 1,
      updatedBy: input.actorId,
      updatedAt: now(),
    };
    this.capacities.set(bungalowId, updated);
    return updated;
  }
}

type CapacityRow = {
  bungalow_id: string;
  total_units: number;
  version: number;
  updated_by: string | null;
  created_at: string | Date;
  updated_at: string | Date;
};

function isoTimestamp(value: string | Date) {
  return value instanceof Date ? value.toISOString() : value;
}

function dateOnly(value: string | Date) {
  return value instanceof Date ? value.toISOString().slice(0, 10) : value;
}

function hydrateCapacity(row: CapacityRow): BungalowCapacityRecord {
  return {
    bungalowId: row.bungalow_id,
    totalUnits: row.total_units,
    version: row.version,
    updatedBy: row.updated_by,
    createdAt: isoTimestamp(row.created_at),
    updatedAt: isoTimestamp(row.updated_at),
  };
}

export class PostgresBungalowCapacityStore implements BungalowCapacityStoreLike {
  private bootstrapPromise: Promise<void> | null = null;

  constructor(private readonly pool: Pool) {}

  private async ensureBootstrapped() {
    if (!this.bootstrapPromise) this.bootstrapPromise = this.bootstrap();
    await this.bootstrapPromise;
  }

  private async bootstrap() {
    await this.pool.query(`
      create table if not exists bungalow_capacity (
        bungalow_id text primary key references bungalow(id),
        total_units integer not null check (total_units >= 0),
        version integer not null default 1,
        updated_by text,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      )
    `);
    for (const seed of APPROVED_BUNGALOW_CAPACITIES) {
      await this.pool.query(
        `insert into bungalow_capacity (bungalow_id, total_units) values ($1, $2) on conflict (bungalow_id) do nothing`,
        [seed.bungalowId, seed.totalUnits],
      );
    }
  }

  async getCapacity(bungalowId: string) {
    await this.ensureBootstrapped();
    const result = await this.pool.query<CapacityRow>(
      `select bungalow_id, total_units, version, updated_by, created_at, updated_at from bungalow_capacity where bungalow_id = $1`,
      [bungalowId],
    );
    return result.rows[0] ? hydrateCapacity(result.rows[0]) : null;
  }

  async listCapacities() {
    await this.ensureBootstrapped();
    const result = await this.pool.query<CapacityRow>(
      `select bungalow_id, total_units, version, updated_by, created_at, updated_at from bungalow_capacity order by bungalow_id`,
    );
    return result.rows.map(hydrateCapacity);
  }

  async updateCapacity(bungalowId: string, input: UpdateCapacityInput) {
    if (!Number.isInteger(input.totalUnits) || input.totalUnits < 0) throw new Error("invalid_total_units");
    await this.ensureBootstrapped();
    return this.withTransaction(async (client) => {
      await this.lockCategory(client, bungalowId);
      const current = await this.getCapacityForUpdate(client, bungalowId);
      if (current.version !== input.expectedVersion) throw new Error("capacity_version_conflict");
      await this.assertDatabaseCommitments(client, bungalowId, input.totalUnits);
      const result = await client.query<CapacityRow>(
        `update bungalow_capacity set total_units = $2, version = version + 1, updated_by = $3, updated_at = now() where bungalow_id = $1 returning bungalow_id, total_units, version, updated_by, created_at, updated_at`,
        [bungalowId, input.totalUnits, input.actorId],
      );
      return hydrateCapacity(result.rows[0]);
    });
  }

  private async withTransaction<T>(work: (client: PoolClient) => Promise<T>) {
    const client = await this.pool.connect();
    try {
      await client.query("begin");
      const result = await work(client);
      await client.query("commit");
      return result;
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }

  private async lockCategory(client: PoolClient, bungalowId: string) {
    await client.query(`select pg_advisory_xact_lock(hashtext('bungalow-capacity:' || $1))`, [bungalowId]);
  }

  private async getCapacityForUpdate(client: PoolClient, bungalowId: string) {
    const result = await client.query<CapacityRow>(
      `select bungalow_id, total_units, version, updated_by, created_at, updated_at from bungalow_capacity where bungalow_id = $1 for update`,
      [bungalowId],
    );
    if (!result.rows[0]) throw new Error("bungalow_capacity_not_found");
    return hydrateCapacity(result.rows[0]);
  }

  private async assertDatabaseCommitments(client: PoolClient, bungalowId: string, proposedTotalUnits: number) {
    const reservations = await client.query<{
      id: string;
      bungalow_id: string;
      start_date: string | Date;
      end_date: string | Date;
      status: CapacityReservationCommitment["status"];
    }>(
      `select id, bungalow_id, start_date, end_date, status from reservation where bungalow_id = $1 and status in ('ota_imported_confirmed', 'confirmed', 'assigned', 'checked_in', 'checked_out', 'paid')`,
      [bungalowId],
    );
    assertCapacityCanCoverCommitments({
      bungalowId,
      proposedTotalUnits,
      reservations: reservations.rows.map((row) => ({
        id: row.id,
        bungalowId: row.bungalow_id,
        checkIn: dateOnly(row.start_date),
        checkOut: dateOnly(row.end_date),
        status: row.status,
      })),
    });
  }
}

export function createInMemoryCapacityStore(): BungalowCapacityStoreLike {
  return new InMemoryBungalowCapacityStore();
}

let activeStore: BungalowCapacityStoreLike | null = null;

function resolveActiveStore() {
  if (activeStore) return activeStore;
  activeStore = process.env.DATABASE_URL?.trim()
    ? new PostgresBungalowCapacityStore(getPool())
    : new InMemoryBungalowCapacityStore();
  return activeStore;
}

export const bungalowCapacityStore: BungalowCapacityStoreLike = new Proxy({} as BungalowCapacityStoreLike, {
  get(_target, property, receiver) {
    return Reflect.get(resolveActiveStore(), property, receiver);
  },
});

export function getInMemoryCapacitySnapshot(bungalowId: string) {
  const store = resolveActiveStore();
  if (!(store instanceof InMemoryBungalowCapacityStore)) return null;
  return { capacity: store.peekCapacity(bungalowId) };
}
