#!/usr/bin/env node

const { readdirSync, readFileSync } = require("node:fs");
const { join, resolve } = require("node:path");
const { Client } = require("pg");

const action = process.argv[2] ?? "up";
const migrationsDir = resolve(process.cwd(), "db", "migrations");

if (action !== "up") {
  console.error(`Unsupported migration action: ${action}. Only "up" is implemented.`);
  process.exit(1);
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is required to run migrations.");
  process.exit(1);
}

async function main() {
  const client = new Client({ connectionString });
  await client.connect();

  try {
    await client.query(`
      create table if not exists schema_migrations (
        version text primary key,
        applied_at timestamptz not null default now()
      )
    `);

    const applied = await client.query("select version from schema_migrations");
    const appliedVersions = new Set(applied.rows.map((row) => row.version));

    const files = readdirSync(migrationsDir)
      .filter((file) => file.endsWith(".sql"))
      .sort();

    for (const file of files) {
      if (appliedVersions.has(file)) continue;

      const sql = readFileSync(join(migrationsDir, file), "utf8");
      await client.query("begin");
      try {
        await client.query(sql);
        await client.query("insert into schema_migrations(version) values($1)", [file]);
        await client.query("commit");
        console.log(`Applied ${file}`);
      } catch (error) {
        await client.query("rollback");
        throw error;
      }
    }
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
