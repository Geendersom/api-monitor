import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { Pool } from "pg";

import { createPool } from "../../src/db/client.js";
import { runMigrations } from "../../src/db/migrate.js";
import type { CheckResult } from "../../src/monitors/history.js";
import {
  buildMonitorSla,
  calculateObservedDowntimeMs,
} from "../../src/monitors/sla.js";
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

describeIntegration("PostgreSQL monitor SLA", () => {
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

  it("aggregates DOWN checks into observed downtime", async () => {
    const monitor = await repositories.monitorRepository.create({
      name: "SLA A",
      url: "https://example.com/a",
    });

    await repositories.checkHistoryRepository.add(
      createStoredCheck(monitor.id, {
        status: "down",
        checkedAt: "2026-08-14T18:00:00.000Z",
      }),
    );
    await repositories.checkHistoryRepository.add(
      createStoredCheck(monitor.id, {
        status: "down",
        checkedAt: "2026-08-14T18:30:00.000Z",
      }),
    );

    const stats = await repositories.checkHistoryRepository.getUptimeStats(
      monitor.id,
      "2026-08-14T17:00:00.000Z",
      "2026-08-14T20:00:00.000Z",
    );

    expect(calculateObservedDowntimeMs(stats.failedChecks)).toBe(60_000);
  });

  it("ignores checks outside the period when building SLA input", async () => {
    const monitor = await repositories.monitorRepository.create({
      name: "SLA B",
      url: "https://example.com/b",
    });

    await repositories.checkHistoryRepository.add(
      createStoredCheck(monitor.id, {
        status: "down",
        checkedAt: "2026-08-14T16:59:59.999Z",
      }),
    );
    await repositories.checkHistoryRepository.add(
      createStoredCheck(monitor.id, {
        status: "down",
        checkedAt: "2026-08-14T17:00:00.000Z",
      }),
    );

    const stats = await repositories.checkHistoryRepository.getUptimeStats(
      monitor.id,
      "2026-08-14T17:00:00.000Z",
      "2026-08-14T20:00:00.000Z",
    );

    expect(stats.failedChecks).toBe(1);
  });

  it("builds compliant SLA when downtime is within the allowed budget", async () => {
    const monitor = await repositories.monitorRepository.create({
      name: "SLA C",
      url: "https://example.com/c",
    });

    await repositories.checkHistoryRepository.add(
      createStoredCheck(monitor.id, {
        status: "down",
        checkedAt: "2026-08-14T18:00:00.000Z",
      }),
    );

    const stats = await repositories.checkHistoryRepository.getUptimeStats(
      monitor.id,
      "2026-08-14T17:00:00.000Z",
      "2026-08-14T20:00:00.000Z",
    );

    const sla = buildMonitorSla(
      monitor.id,
      "24h",
      "2026-08-13T20:00:00.000Z",
      "2026-08-14T20:00:00.000Z",
      stats,
    );

    expect(sla.status).toBe("compliant");
    expect(sla.downtimeMs).toBe(30_000);
  });

  it("builds breached SLA when downtime exceeds the allowed budget", async () => {
    const monitor = await repositories.monitorRepository.create({
      name: "SLA D",
      url: "https://example.com/d",
    });

    for (let index = 0; index < 4; index += 1) {
      await repositories.checkHistoryRepository.add(
        createStoredCheck(monitor.id, {
          status: "down",
          checkedAt: `2026-08-14T18:0${index}:00.000Z`,
        }),
      );
    }

    const stats = await repositories.checkHistoryRepository.getUptimeStats(
      monitor.id,
      "2026-08-14T17:00:00.000Z",
      "2026-08-14T20:00:00.000Z",
    );

    const sla = buildMonitorSla(
      monitor.id,
      "24h",
      "2026-08-13T20:00:00.000Z",
      "2026-08-14T20:00:00.000Z",
      stats,
    );

    expect(sla.status).toBe("breached");
    expect(sla.exceededDowntimeMs).toBeGreaterThan(0);
  });

  it("keeps SLA input isolated by monitor", async () => {
    const monitorA = await repositories.monitorRepository.create({
      name: "SLA E",
      url: "https://example.com/e",
    });
    const monitorB = await repositories.monitorRepository.create({
      name: "SLA F",
      url: "https://example.com/f",
    });

    await repositories.checkHistoryRepository.add(
      createStoredCheck(monitorA.id, {
        status: "up",
        checkedAt: "2026-08-14T18:00:00.000Z",
      }),
    );
    await repositories.checkHistoryRepository.add(
      createStoredCheck(monitorB.id, {
        status: "down",
        checkedAt: "2026-08-14T18:00:00.000Z",
      }),
    );

    const stats = await repositories.checkHistoryRepository.getUptimeStats(
      monitorA.id,
      "2026-08-14T17:00:00.000Z",
      "2026-08-14T20:00:00.000Z",
    );

    expect(stats.failedChecks).toBe(0);
    expect(calculateObservedDowntimeMs(stats.failedChecks)).toBe(0);
  });
});
