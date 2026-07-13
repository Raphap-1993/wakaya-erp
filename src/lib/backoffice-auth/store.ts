import { createHash, randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import type { Pool } from "pg";

import { BACKOFFICE_SESSION_COOKIE } from "@/lib/backoffice-auth/constants";
import { sanitizeRoles } from "@/lib/rbac";
import { getPool } from "@/lib/reservations/postgres";

const DEFAULT_STORAGE_PATH = ".data/wakaya-backoffice-auth.snapshot.json";
const DEFAULT_SESSION_TTL_HOURS = 12;

export type BackofficeUser = {
  id: string;
  email: string;
  name: string;
  roles: string[];
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string | null;
};

type StoredBackofficeUser = BackofficeUser & {
  passwordHash: string;
};

export type BackofficeSession = {
  id: string;
  userId: string;
  expiresAt: string;
  createdAt?: string;
  lastSeenAt?: string;
};

type StoredBackofficeSession = BackofficeSession & {
  tokenHash: string;
};

type PersistedSnapshot = {
  users: StoredBackofficeUser[];
  sessions: StoredBackofficeSession[];
};

export type BackofficeSessionContext = {
  user: BackofficeUser;
  session: BackofficeSession;
};

export type BackofficeUserCreateInput = {
  email: string;
  name: string;
  password: string;
  roles: string[];
  active?: boolean;
};

export type BackofficeUserUpdateInput = {
  email: string;
  name: string;
  password?: string;
  roles: string[];
  active: boolean;
};

type BootstrapConfig = {
  email: string;
  name: string;
  password: string;
  roles: string[];
};

export interface BackofficeAuthStoreLike {
  authenticateWithPassword(email: string, password: string): Promise<BackofficeUser | null>;
  createSession(user: BackofficeUser): Promise<{ token: string; session: BackofficeSession }>;
  getSession(token: string): Promise<BackofficeSessionContext | null>;
  deleteSession(token: string): Promise<void>;
  listUsers(): Promise<BackofficeUser[]>;
  getUser(id: string): Promise<BackofficeUser | null>;
  createUser(input: BackofficeUserCreateInput): Promise<BackofficeUser>;
  updateUser(id: string, input: BackofficeUserUpdateInput): Promise<BackofficeUser>;
}

function isoNow(): string {
  return new Date().toISOString();
}

function resolveSessionTtlHours(): number {
  const value = Number(process.env.BACKOFFICE_SESSION_TTL_HOURS ?? DEFAULT_SESSION_TTL_HOURS);
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_SESSION_TTL_HOURS;
}

function sessionExpiryDate(): string {
  return new Date(Date.now() + resolveSessionTtlHours() * 60 * 60 * 1000).toISOString();
}

function resolveBootstrapConfig(): BootstrapConfig {
  return {
    email: (process.env.BACKOFFICE_BOOTSTRAP_EMAIL?.trim() || "admin@wakaya.local").toLowerCase(),
    name: process.env.BACKOFFICE_BOOTSTRAP_NAME?.trim() || "Backoffice Admin",
    password: process.env.BACKOFFICE_BOOTSTRAP_PASSWORD?.trim() || "wakaya-admin-123",
    roles: (process.env.BACKOFFICE_BOOTSTRAP_ROLES?.trim() || "admin")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  };
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizeName(name: string): string {
  return name.trim();
}

function normalizeRoles(roles: readonly string[]): string[] {
  const normalized = sanitizeRoles(
    roles
      .map((role) => role.trim())
      .filter(Boolean),
  );
  if (normalized.length === 0) {
    throw new Error("invalid_roles");
  }
  return Array.from(new Set(normalized));
}

function assertPassword(password: string): string {
  const normalized = password.trim();
  if (normalized.length < 8) {
    throw new Error("invalid_password");
  }
  return normalized;
}

function ensureCreateInput(input: BackofficeUserCreateInput) {
  const email = normalizeEmail(input.email);
  const name = normalizeName(input.name);
  const password = assertPassword(input.password);
  const roles = normalizeRoles(input.roles);
  if (!email) throw new Error("invalid_email");
  if (!name) throw new Error("invalid_name");

  return {
    email,
    name,
    password,
    roles,
    active: input.active ?? true,
  };
}

function ensureUpdateInput(input: BackofficeUserUpdateInput) {
  const email = normalizeEmail(input.email);
  const name = normalizeName(input.name);
  const roles = normalizeRoles(input.roles);
  if (!email) throw new Error("invalid_email");
  if (!name) throw new Error("invalid_name");

  return {
    email,
    name,
    password: input.password ? assertPassword(input.password) : undefined,
    roles,
    active: input.active,
  };
}

function isActiveAdmin(user: Pick<BackofficeUser, "active" | "roles">): boolean {
  return user.active && user.roles.includes("admin");
}

function resolveStoragePath(): string | null {
  const configured = process.env.WAKAYA_BACKOFFICE_AUTH_PATH?.trim();
  if (configured) return configured;
  return process.env.NODE_ENV === "test" ? null : DEFAULT_STORAGE_PATH;
}

function readSnapshot(storagePath: string): PersistedSnapshot | null {
  try {
    if (!existsSync(storagePath)) return null;
    const raw = readFileSync(storagePath, "utf8").trim();
    if (!raw) return null;
    return JSON.parse(raw) as PersistedSnapshot;
  } catch {
    return null;
  }
}

function writeSnapshot(storagePath: string, snapshot: PersistedSnapshot) {
  mkdirSync(dirname(storagePath), { recursive: true });
  writeFileSync(storagePath, JSON.stringify(snapshot, null, 2));
}

function hashPassword(password: string, salt = randomBytes(16).toString("hex")): string {
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${derived}`;
}

function verifyPassword(password: string, passwordHash: string): boolean {
  const [scheme, salt, digest] = passwordHash.split(":");
  if (scheme !== "scrypt" || !salt || !digest) return false;

  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(digest, "hex");
  if (candidate.length !== expected.length) return false;
  return timingSafeEqual(candidate, expected);
}

function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function sanitizeUser(user: StoredBackofficeUser): BackofficeUser {
  const { passwordHash: _passwordHash, ...safe } = user;
  return safe;
}

function sanitizeSession(session: StoredBackofficeSession): BackofficeSession {
  const { tokenHash: _tokenHash, ...safe } = session;
  return safe;
}

function isExpired(expiresAt: string): boolean {
  return Date.parse(expiresAt) <= Date.now();
}

class FallbackBackofficeAuthStore implements BackofficeAuthStoreLike {
  constructor(private readonly storagePath: string | null) {}

  async authenticateWithPassword(email: string, password: string): Promise<BackofficeUser | null> {
    const snapshot = this.ensureSnapshot();
    const user = snapshot.users.find((item) => item.active && item.email === normalizeEmail(email));
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return null;
    }

    user.lastLoginAt = isoNow();
    user.updatedAt = user.lastLoginAt;
    this.persist(snapshot);
    return sanitizeUser(user);
  }

  async createSession(user: BackofficeUser): Promise<{ token: string; session: BackofficeSession }> {
    const snapshot = this.ensureSnapshot();
    const token = randomBytes(32).toString("hex");
    const now = isoNow();
    const session: StoredBackofficeSession = {
      id: randomUUID(),
      userId: user.id,
      tokenHash: hashSessionToken(token),
      expiresAt: sessionExpiryDate(),
      createdAt: now,
      lastSeenAt: now,
    };
    snapshot.sessions = snapshot.sessions.filter((item) => !isExpired(item.expiresAt));
    snapshot.sessions.push(session);
    this.persist(snapshot);

    return {
      token,
      session: sanitizeSession(session),
    };
  }

  async getSession(token: string): Promise<BackofficeSessionContext | null> {
    const snapshot = this.ensureSnapshot();
    const tokenHash = hashSessionToken(token);
    const session = snapshot.sessions.find((item) => item.tokenHash === tokenHash);
    if (!session) {
      return null;
    }
    if (isExpired(session.expiresAt)) {
      snapshot.sessions = snapshot.sessions.filter((item) => item.id !== session.id);
      this.persist(snapshot);
      return null;
    }

    const user = snapshot.users.find((item) => item.id === session.userId && item.active);
    if (!user) {
      snapshot.sessions = snapshot.sessions.filter((item) => item.id !== session.id);
      this.persist(snapshot);
      return null;
    }

    session.lastSeenAt = isoNow();
    this.persist(snapshot);

    return {
      user: sanitizeUser(user),
      session: sanitizeSession(session),
    };
  }

  async deleteSession(token: string): Promise<void> {
    const snapshot = this.ensureSnapshot();
    const tokenHash = hashSessionToken(token);
    snapshot.sessions = snapshot.sessions.filter((item) => item.tokenHash !== tokenHash);
    this.persist(snapshot);
  }

  async listUsers(): Promise<BackofficeUser[]> {
    const snapshot = this.ensureSnapshot();
    return snapshot.users
      .map((user) => sanitizeUser(user))
      .sort((left, right) => left.email.localeCompare(right.email));
  }

  async getUser(id: string): Promise<BackofficeUser | null> {
    const snapshot = this.ensureSnapshot();
    const user = snapshot.users.find((item) => item.id === id);
    return user ? sanitizeUser(user) : null;
  }

  async createUser(input: BackofficeUserCreateInput): Promise<BackofficeUser> {
    const snapshot = this.ensureSnapshot();
    const normalized = ensureCreateInput(input);

    if (snapshot.users.some((user) => user.email === normalized.email)) {
      throw new Error("email_taken");
    }

    const now = isoNow();
    const user: StoredBackofficeUser = {
      id: randomUUID(),
      email: normalized.email,
      name: normalized.name,
      roles: normalized.roles,
      active: normalized.active,
      passwordHash: hashPassword(normalized.password),
      createdAt: now,
      updatedAt: now,
      lastLoginAt: null,
    };
    snapshot.users.push(user);
    this.persist(snapshot);
    return sanitizeUser(user);
  }

  async updateUser(id: string, input: BackofficeUserUpdateInput): Promise<BackofficeUser> {
    const snapshot = this.ensureSnapshot();
    const user = snapshot.users.find((item) => item.id === id);
    if (!user) {
      throw new Error("user_not_found");
    }

    const normalized = ensureUpdateInput(input);
    const duplicate = snapshot.users.find((item) => item.id !== id && item.email === normalized.email);
    if (duplicate) {
      throw new Error("email_taken");
    }

    const candidate: StoredBackofficeUser = {
      ...user,
      email: normalized.email,
      name: normalized.name,
      roles: normalized.roles,
      active: normalized.active,
      passwordHash: normalized.password ? hashPassword(normalized.password) : user.passwordHash,
      updatedAt: isoNow(),
    };

    const activeAdminsAfter = snapshot.users.filter((item) => item.id !== id).filter(isActiveAdmin).length
      + (isActiveAdmin(candidate) ? 1 : 0);
    if (activeAdminsAfter === 0) {
      throw new Error("last_admin_required");
    }

    Object.assign(user, candidate);
    this.persist(snapshot);
    return sanitizeUser(user);
  }

  private ensureSnapshot(): PersistedSnapshot {
    const snapshot =
      (this.storagePath ? readSnapshot(this.storagePath) : null) ?? {
        users: [],
        sessions: [],
      };

    if (snapshot.users.length === 0) {
      const bootstrap = resolveBootstrapConfig();
      const now = isoNow();
      snapshot.users.push({
        id: randomUUID(),
        email: bootstrap.email,
        name: bootstrap.name,
        roles: bootstrap.roles,
        active: true,
        passwordHash: hashPassword(bootstrap.password),
        createdAt: now,
        updatedAt: now,
        lastLoginAt: null,
      });
      this.persist(snapshot);
    }

    snapshot.sessions = snapshot.sessions.filter((item) => !isExpired(item.expiresAt));
    return snapshot;
  }

  private persist(snapshot: PersistedSnapshot) {
    if (!this.storagePath) return;
    writeSnapshot(this.storagePath, snapshot);
  }
}

class PostgresBackofficeAuthStore implements BackofficeAuthStoreLike {
  private bootstrapPromise: Promise<void> | null = null;

  constructor(private readonly pool: Pool) {}

  async authenticateWithPassword(email: string, password: string): Promise<BackofficeUser | null> {
    await this.ensureBootstrap();
    const result = await this.pool.query<{
      id: string;
      email: string;
      name: string;
      roles: string[];
      active: boolean;
      password_hash: string;
      created_at: string;
      updated_at: string;
      last_login_at: string | null;
    }>(
      `
        select id, email, name, roles, active, password_hash, created_at, updated_at, last_login_at
        from backoffice_user
        where lower(email) = lower($1)
        limit 1
      `,
      [normalizeEmail(email)],
    );

    const user = result.rows[0];
    if (!user || !user.active || !verifyPassword(password, user.password_hash)) {
      return null;
    }

    const lastLoginAt = isoNow();
    await this.pool.query(
      `
        update backoffice_user
        set last_login_at = $2, updated_at = $2
        where id = $1
      `,
      [user.id, lastLoginAt],
    );

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      roles: user.roles,
      active: user.active,
      createdAt: user.created_at,
      updatedAt: lastLoginAt,
      lastLoginAt,
    };
  }

  async createSession(user: BackofficeUser): Promise<{ token: string; session: BackofficeSession }> {
    await this.ensureBootstrap();
    const token = randomBytes(32).toString("hex");
    const now = isoNow();
    const session: StoredBackofficeSession = {
      id: randomUUID(),
      userId: user.id,
      tokenHash: hashSessionToken(token),
      expiresAt: sessionExpiryDate(),
      createdAt: now,
      lastSeenAt: now,
    };

    await this.pool.query(
      `
        insert into backoffice_session (id, user_id, token_hash, expires_at, created_at, last_seen_at)
        values ($1, $2, $3, $4, $5, $6)
      `,
      [session.id, session.userId, session.tokenHash, session.expiresAt, session.createdAt, session.lastSeenAt],
    );

    return {
      token,
      session: sanitizeSession(session),
    };
  }

  async getSession(token: string): Promise<BackofficeSessionContext | null> {
    await this.ensureBootstrap();
    const tokenHash = hashSessionToken(token);
    await this.pool.query(`delete from backoffice_session where expires_at <= now()`);

    const result = await this.pool.query<{
      session_id: string;
      session_user_id: string;
      session_expires_at: string;
      session_created_at: string;
      session_last_seen_at: string;
      user_id: string;
      user_email: string;
      user_name: string;
      user_roles: string[];
      user_active: boolean;
      user_created_at: string;
      user_updated_at: string;
      user_last_login_at: string | null;
    }>(
      `
        select
          s.id as session_id,
          s.user_id as session_user_id,
          s.expires_at as session_expires_at,
          s.created_at as session_created_at,
          s.last_seen_at as session_last_seen_at,
          u.id as user_id,
          u.email as user_email,
          u.name as user_name,
          u.roles as user_roles,
          u.active as user_active,
          u.created_at as user_created_at,
          u.updated_at as user_updated_at,
          u.last_login_at as user_last_login_at
        from backoffice_session s
        join backoffice_user u on u.id = s.user_id
        where s.token_hash = $1
        limit 1
      `,
      [tokenHash],
    );

    const row = result.rows[0];
    if (!row || !row.user_active || isExpired(row.session_expires_at)) {
      return null;
    }

    const lastSeenAt = isoNow();
    await this.pool.query(`update backoffice_session set last_seen_at = $2 where id = $1`, [
      row.session_id,
      lastSeenAt,
    ]);

    return {
      user: {
        id: row.user_id,
        email: row.user_email,
        name: row.user_name,
        roles: row.user_roles,
        active: row.user_active,
        createdAt: row.user_created_at,
        updatedAt: row.user_updated_at,
        lastLoginAt: row.user_last_login_at,
      },
      session: {
        id: row.session_id,
        userId: row.session_user_id,
        expiresAt: row.session_expires_at,
        createdAt: row.session_created_at,
        lastSeenAt,
      },
    };
  }

  async deleteSession(token: string): Promise<void> {
    await this.ensureBootstrap();
    await this.pool.query(`delete from backoffice_session where token_hash = $1`, [hashSessionToken(token)]);
  }

  async listUsers(): Promise<BackofficeUser[]> {
    await this.ensureBootstrap();
    const result = await this.pool.query<{
      id: string;
      email: string;
      name: string;
      roles: string[];
      active: boolean;
      created_at: string;
      updated_at: string;
      last_login_at: string | null;
    }>(
      `
        select id, email, name, roles, active, created_at, updated_at, last_login_at
        from backoffice_user
        order by lower(email) asc
      `,
    );

    return result.rows.map((row) => ({
      id: row.id,
      email: row.email,
      name: row.name,
      roles: row.roles,
      active: row.active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lastLoginAt: row.last_login_at,
    }));
  }

  async getUser(id: string): Promise<BackofficeUser | null> {
    await this.ensureBootstrap();
    const result = await this.pool.query<{
      id: string;
      email: string;
      name: string;
      roles: string[];
      active: boolean;
      created_at: string;
      updated_at: string;
      last_login_at: string | null;
    }>(
      `
        select id, email, name, roles, active, created_at, updated_at, last_login_at
        from backoffice_user
        where id = $1
        limit 1
      `,
      [id],
    );
    const row = result.rows[0];
    if (!row) return null;

    return {
      id: row.id,
      email: row.email,
      name: row.name,
      roles: row.roles,
      active: row.active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lastLoginAt: row.last_login_at,
    };
  }

  async createUser(input: BackofficeUserCreateInput): Promise<BackofficeUser> {
    await this.ensureBootstrap();
    const normalized = ensureCreateInput(input);
    const existing = await this.pool.query<{ id: string }>(
      `select id from backoffice_user where lower(email) = lower($1) limit 1`,
      [normalized.email],
    );
    if (existing.rowCount && existing.rowCount > 0) {
      throw new Error("email_taken");
    }

    const now = isoNow();
    const result = await this.pool.query<{
      id: string;
      email: string;
      name: string;
      roles: string[];
      active: boolean;
      created_at: string;
      updated_at: string;
      last_login_at: string | null;
    }>(
      `
        insert into backoffice_user (id, email, name, password_hash, roles, active, last_login_at, created_at, updated_at)
        values ($1, $2, $3, $4, $5::jsonb, $6, null, $7, $7)
        returning id, email, name, roles, active, created_at, updated_at, last_login_at
      `,
      [
        randomUUID(),
        normalized.email,
        normalized.name,
        hashPassword(normalized.password),
        JSON.stringify(normalized.roles),
        normalized.active,
        now,
      ],
    );

    const row = result.rows[0];
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      roles: row.roles,
      active: row.active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lastLoginAt: row.last_login_at,
    };
  }

  async updateUser(id: string, input: BackofficeUserUpdateInput): Promise<BackofficeUser> {
    await this.ensureBootstrap();
    const normalized = ensureUpdateInput(input);
    const current = await this.getUser(id);
    if (!current) {
      throw new Error("user_not_found");
    }

    const duplicate = await this.pool.query<{ id: string }>(
      `select id from backoffice_user where lower(email) = lower($1) and id <> $2 limit 1`,
      [normalized.email, id],
    );
    if (duplicate.rowCount && duplicate.rowCount > 0) {
      throw new Error("email_taken");
    }

    const activeAdminsResult = await this.pool.query<{ total: string }>(
      `
        select count(*)::text as total
        from backoffice_user
        where id <> $1 and active = true and roles @> '["admin"]'::jsonb
      `,
      [id],
    );
    const activeAdmins = Number.parseInt(activeAdminsResult.rows[0]?.total ?? "0", 10);
    if (activeAdmins + (isActiveAdmin({ active: normalized.active, roles: normalized.roles }) ? 1 : 0) === 0) {
      throw new Error("last_admin_required");
    }

    const now = isoNow();
    const result = await this.pool.query<{
      id: string;
      email: string;
      name: string;
      roles: string[];
      active: boolean;
      created_at: string;
      updated_at: string;
      last_login_at: string | null;
    }>(
      `
        update backoffice_user
        set
          email = $2,
          name = $3,
          roles = $4::jsonb,
          active = $5,
          password_hash = coalesce($6, password_hash),
          updated_at = $7
        where id = $1
        returning id, email, name, roles, active, created_at, updated_at, last_login_at
      `,
      [
        id,
        normalized.email,
        normalized.name,
        JSON.stringify(normalized.roles),
        normalized.active,
        normalized.password ? hashPassword(normalized.password) : null,
        now,
      ],
    );

    const row = result.rows[0];
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      roles: row.roles,
      active: row.active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lastLoginAt: row.last_login_at,
    };
  }

  private async ensureBootstrap(): Promise<void> {
    if (this.bootstrapPromise) {
      await this.bootstrapPromise;
      return;
    }

    this.bootstrapPromise = this.bootstrapInternal();
    await this.bootstrapPromise;
  }

  private async bootstrapInternal(): Promise<void> {
    await this.pool.query(`
      create table if not exists backoffice_user (
        id uuid primary key,
        email text not null,
        name text not null,
        password_hash text not null,
        roles jsonb not null default '["admin"]'::jsonb,
        active boolean not null default true,
        last_login_at timestamptz,
        created_at timestamptz not null,
        updated_at timestamptz not null
      )
    `);

    await this.pool.query(`
      create unique index if not exists idx_backoffice_user_email_lower
      on backoffice_user (lower(email))
    `);

    await this.pool.query(`
      create table if not exists backoffice_session (
        id uuid primary key,
        user_id uuid not null references backoffice_user(id) on delete cascade,
        token_hash text not null unique,
        expires_at timestamptz not null,
        created_at timestamptz not null,
        last_seen_at timestamptz not null
      )
    `);

    const bootstrap = resolveBootstrapConfig();
    const existing = await this.pool.query<{ id: string }>(
      `select id from backoffice_user where lower(email) = lower($1) limit 1`,
      [bootstrap.email],
    );
    if (existing.rowCount && existing.rowCount > 0) {
      return;
    }

    const now = isoNow();
    await this.pool.query(
      `
        insert into backoffice_user (id, email, name, password_hash, roles, active, last_login_at, created_at, updated_at)
        values ($1, $2, $3, $4, $5::jsonb, true, null, $6, $6)
      `,
      [
        randomUUID(),
        bootstrap.email,
        bootstrap.name,
        hashPassword(bootstrap.password),
        JSON.stringify(bootstrap.roles),
        now,
      ],
    );
  }
}

export const backofficeAuthStore: BackofficeAuthStoreLike = process.env.DATABASE_URL?.trim()
  ? new PostgresBackofficeAuthStore(getPool())
  : new FallbackBackofficeAuthStore(resolveStoragePath());
