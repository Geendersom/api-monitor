import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { Pool } from "pg";

import { createPool } from "../../src/db/client.js";
import { runMigrations } from "../../src/db/migrate.js";
import type { CheckResult } from "../../src/monitors/history.js";
import { createPostgresRepositories } from "../../src/repositories/postgres/index.js";
import type { Repositories } from "../../src/repositories/types.js";

const databaseUrl = process.env.DATABASE_URL;
const describeIntegration = databaseUrl ? describe : describe.skip;

const truncateTables = async (pool: Pool): Promise<void> => {
  await pool.query(`
    TRUNCATE TABLE
      alert_events,
      incidents,
      check_results,
      monitors
    RESTART IDENTITY CASCADE
  `);
};

const createStoredCheck = (
  monitorId: string,
  overrides: Partial<CheckResult> = {},
): CheckResult => ({
  id: randomUUID(),
  monitorId,
  status: "up",
  responseTimeMs: 100,
  checkedAt: "2026-08-14T19:00:00.000Z",
  ...overrides,
});

describeIntegration("PostgreSQL monitor uptime", () => {
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

  it("counts checks inside the period", async () => {
    const monitor = await repositories.monitorRepository.create({
      name: "Uptime A",
      url: "https://example.com/a",
    });

    await repositories.checkHistoryRepository.add(
      createStoredCheck(monitor.id, {
        checkedAt: "2026-08-14T18:00:00.000Z",
      }),
    );
    await repositories.checkHistoryRepository.add(
      createStoredCheck(monitor.id, {
        checkedAt: "2026-08-14T19:00:00.000Z",
      }),
    );

    const stats = await repositories.checkHistoryRepository.getUptimeStats(
      monitor.id,
      "2026-08-14T17:00:00.000Z",
      "2026-08-14T20:00:00.000Z",
    );

    expect(stats.totalChecks).toBe(2);
  });

  it("ignores checks outside the period", async () => {
    const monitor = await repositories.monitorRepository.create({
      name: "Uptime B",
      url: "https://example.com/b",
    });

    await repositories.checkHistoryRepository.add(
      createStoredCheck(monitor.id, {
        checkedAt: "2026-08-14T16:59:59.999Z",
      }),
    );
    await repositories.checkHistoryRepository.add(
      createStoredCheck(monitor.id, {
        checkedAt: "2026-08-14T17:00:00.000Z",
      }),
    );
    await repositories.checkHistoryRepository.add(
      createStoredCheck(monitor.id, {
        checkedAt: "2026-08-14T20:00:00.001Z",
      }),
    );

    const stats = await repositories.checkHistoryRepository.getUptimeStats(
      monitor.id,
      "2026-08-14T17:00:00.000Z",
      "2026-08-14T20:00:00.000Z",
    );

    expect(stats.totalChecks).toBe(1);
  });

  it("aggregates UP and DOWN checks correctly", async () => {
    const monitor = await repositories.monitorRepository.create({
      name: "Uptime C",
      url: "https://example.com/c",
    });

    await repositories.checkHistoryRepository.add(
      createStoredCheck(monitor.id, {
        status: "up",
        checkedAt: "2026-08-14T18:00:00.000Z",
      }),
    );
    await repositories.checkHistoryRepository.add(
      createStoredCheck(monitor.id, {
        status: "down",
        checkedAt: "2026-08-14T18:30:00.000Z",
      }),
    );
    await repositories.checkHistoryRepository.add(
      createStoredCheck(monitor.id, {
        status: "down",
        checkedAt: "2026-08-14T19:00:00.000Z",
      }),
    );

    const stats = await repositories.checkHistoryRepository.getUptimeStats(
      monitor.id,
      "2026-08-14T17:00:00.000Z",
      "2026-08-14T20:00:00.000Z",
    );

    expect(stats.totalChecks).toBe(3);
    expect(stats.successfulChecks).toBe(1);
    expect(stats.failedChecks).toBe(2);
  });

  it("calculates the average response_time_ms correctly", async () => {
    const monitor = await repositories.monitorRepository.create({
      name: "Uptime D",
      url: "https://example.com/d",
    });

    await repositories.checkHistoryRepository.add(
      createStoredCheck(monitor.id, {
        responseTimeMs: 100,
        checkedAt: "2026-08-14T18:00:00.000Z",
      }),
    );
    await repositories.checkHistoryRepository.add(
      createStoredCheck(monitor.id, {
        responseTimeMs: 200,
        checkedAt: "2026-08-14T18:30:00.000Z",
      }),
    );

    const stats = await repositories.checkHistoryRepository.getUptimeStats(
      monitor.id,
      "2026-08-14T17:00:00.000Z",
      "2026-08-14T20:00:00.000Z",
    );

    expect(stats.averageResponseTimeMs).toBe(150);
  });

  it("keeps uptime stats isolated by monitor", async () => {
    const monitorA = await repositories.monitorRepository.create({
      name: "Uptime E",
      url: "https://example.com/e",
    });
    const monitorB = await repositories.monitorRepository.create({
      name: "Uptime F",
      url: "https://example.com/f",
    });

    await repositories.checkHistoryRepository.add(
      createStoredCheck(monitorA.id, {
        checkedAt: "2026-08-14T18:00:00.000Z",
      }),
    );
    await repositories.checkHistoryRepository.add(
      createStoredCheck(monitorB.id, {
        status: "down",
        checkedAt: "2026-08-14T18:00:00.000Z",
      }),
    );
    await repositories.checkHistoryRepository.add(
      createStoredCheck(monitorB.id, {
        status: "down",
        checkedAt: "2026-08-14T18:30:00.000Z",
      }),
    );

    const stats = await repositories.checkHistoryRepository.getUptimeStats(
      monitorA.id,
      "2026-08-14T17:00:00.000Z",
      "2026-08-14T20:00:00.000Z",
    );

    expect(stats.totalChecks).toBe(1);
    expect(stats.successfulChecks).toBe(1);
    expect(stats.failedChecks).toBe(0);
  });
});
