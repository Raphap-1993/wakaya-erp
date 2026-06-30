import { Pool } from "pg";

let pool: Pool | null = null;

export function getReservationDatabaseUrl(): string {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    throw new Error("database_url_missing");
  }
  return connectionString;
}

export function getPool(): Pool {
  pool ??= new Pool({
    connectionString: getReservationDatabaseUrl(),
  });

  return pool;
}
