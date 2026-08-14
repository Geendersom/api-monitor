import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { Pool } from "pg";

import { createPool } from "../../src/db/client.js";
import { runMigrations } from "../../src/db/migrate.js";
import { createPostgresRepositories } from "../../src/repositories/postgres/index.js";
import type { Repositories } from "../../src/repositories/types.js";

const databaseUrl = process.env.DATABASE_URL;
const describeIntegration = databaseUrl ? describe : describe.skip;

const truncateTables = async (pool: Pool): Promise<void> => {
  await pool.query(`
    TRUNCATE TABLE
      maintenance_windows,
      alert_events,
      incidents,
      check_results,
      monitors
    RESTART IDENTITY CASCADE
  `);
};

describeIntegration("PostgreSQL maintenance windows", () => {
  let pool: Pool;
  let repositories: Repositories;

  beforeAll(async () => {
    pool = createPool(databaseUrl!);
    await runMigrations(pool);
    repositories = createPostgresRepositories(pool);
  });

  beforeEach(async () => {
    await truncateTables(pool);
  });

  afterAll(async () => {
    await pool.end();
  });

  it("persists a maintenance window", async () => {
    const monitor = await repositories.monitorRepository.create({
      name: "Maintenance Monitor",
      url: "https://example.com/health",
    });

    const maintenance = await repositories.maintenanceRepository.create({
      monitorId: monitor.id,
      title: "Upgrade",
      startsAt: "2026-08-20T02:00:00.000Z",
      endsAt: "2026-08-20T03:00:00.000Z",
    });

    const listed = await repositories.maintenanceRepository.findByMonitorId(
      monitor.id,
    );

    expect(listed).toEqual([maintenance]);
  });

  it("finds active maintenance at a timestamp", async () => {
    const monitor = await repositories.monitorRepository.create({
      name: "Active Maintenance Monitor",
      url: "https://example.com/health",
    });

    await repositories.maintenanceRepository.create({
      monitorId: monitor.id,
      title: "Active",
      startsAt: "2026-08-20T02:00:00.000Z",
      endsAt: "2026-08-20T03:00:00.000Z",
    });

    const active = await repositories.maintenanceRepository.findActiveAt(
      monitor.id,
      "2026-08-20T02:30:00.000Z",
    );

    expect(active?.title).toBe("Active");
  });

  it("detects overlapping maintenance windows", async () => {
    const monitor = await repositories.monitorRepository.create({
      name: "Overlap Monitor",
      url: "https://example.com/health",
    });

    await repositories.maintenanceRepository.create({
      monitorId: monitor.id,
      title: "Existing",
      startsAt: "2026-08-20T02:00:00.000Z",
      endsAt: "2026-08-20T03:00:00.000Z",
    });

    const overlap =
      await repositories.maintenanceRepository.hasOverlappingWindow(
        monitor.id,
        "2026-08-20T02:30:00.000Z",
        "2026-08-20T03:30:00.000Z",
      );

    expect(overlap).toBe(true);
  });

  it("keeps maintenance isolated by monitor", async () => {
    const monitorA = await repositories.monitorRepository.create({
      name: "Monitor A",
      url: "https://example.com/a",
    });
    const monitorB = await repositories.monitorRepository.create({
      name: "Monitor B",
      url: "https://example.com/b",
    });

    await repositories.maintenanceRepository.create({
      monitorId: monitorA.id,
      title: "Only A",
      startsAt: "2026-08-20T02:00:00.000Z",
      endsAt: "2026-08-20T03:00:00.000Z",
    });

    const listed = await repositories.maintenanceRepository.findByMonitorId(
      monitorB.id,
    );

    expect(listed).toEqual([]);
  });

  it("deletes maintenance windows", async () => {
    const monitor = await repositories.monitorRepository.create({
      name: "Delete Monitor",
      url: "https://example.com/delete",
    });

    const maintenance = await repositories.maintenanceRepository.create({
      monitorId: monitor.id,
      title: "Delete me",
      startsAt: "2026-08-20T02:00:00.000Z",
      endsAt: "2026-08-20T03:00:00.000Z",
    });

    const deleted = await repositories.maintenanceRepository.delete(
      monitor.id,
      maintenance.id,
    );

    expect(deleted).toBe(true);
    expect(
      await repositories.maintenanceRepository.findByMonitorId(monitor.id),
    ).toEqual([]);
  });
});
