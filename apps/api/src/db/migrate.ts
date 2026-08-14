import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import type { Pool } from "pg";

const migrationsDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "migrations",
);

const ensureMigrationsTable = async (pool: Pool): Promise<void> => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
};

const isMigrationApplied = async (
  pool: Pool,
  name: string,
): Promise<boolean> => {
  const result = await pool.query<{ exists: boolean }>(
    "SELECT EXISTS(SELECT 1 FROM schema_migrations WHERE name = $1) AS exists",
    [name],
  );

  return result.rows[0]?.exists ?? false;
};

const applyMigration = async (pool: Pool, name: string): Promise<void> => {
  const sql = readFileSync(join(migrationsDir, name), "utf-8");
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await client.query(sql);
    await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [
      name,
    ]);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const runMigrations = async (pool: Pool): Promise<void> => {
  await ensureMigrationsTable(pool);

  const migrationFiles = readdirSync(migrationsDir)
    .filter((fileName) => fileName.endsWith(".sql"))
    .sort();

  for (const migrationFile of migrationFiles) {
    const alreadyApplied = await isMigrationApplied(pool, migrationFile);

    if (alreadyApplied) {
      continue;
    }

    await applyMigration(pool, migrationFile);
  }
};
