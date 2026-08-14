import { buildApp } from "./app.js";
import { closePool, getPool } from "./db/client.js";
import { runMigrations } from "./db/migrate.js";
import { createPostgresRepositories } from "./repositories/postgres/index.js";

const start = async () => {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is required");
    process.exit(1);
  }

  const pool = getPool();

  try {
    await runMigrations(pool);
  } catch (error) {
    console.error("Failed to run database migrations:", error);
    await closePool();
    process.exit(1);
  }

  const repositories = createPostgresRepositories(pool);

  const app = buildApp({
    logger: true,
    repositories,
    onClose: closePool,
  });

  try {
    await app.listen({
      port: 3000,
      host: "127.0.0.1",
    });

    app.monitorScheduler.start();
  } catch (error) {
    app.log.error(error);
    await closePool();
    process.exit(1);
  }
};

start();
