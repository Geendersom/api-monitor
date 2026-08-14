import { closePool, getPool } from "./client.js";
import { runMigrations } from "./migrate.js";

const main = async () => {
  const pool = getPool();

  try {
    await runMigrations(pool);
    console.log("Migrations applied successfully.");
  } finally {
    await closePool();
  }
};

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
