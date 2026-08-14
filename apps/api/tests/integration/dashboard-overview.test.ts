import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { Pool } from "pg";

import { createPool } from "../../src/db/client.js";
import { runMigrations } from "../../src/db/migrate.js";
import {
  DASHBOARD_RECENT_ALERTS_LIMIT,
  getDashboardOverview,
} from "../../src/dashboard/overview.js";
import type { CheckResult } from "../../src/monitors/history.js";
import { createPostgresRepositories } from "../../src/repositories/postgres/index.js";
import type { Repositories } from "../../src/repositories/types.js";

const databaseUrl = process.env.DATABASE_URL;
const describeIntegration = databaseUrl ? describe : describe.skip;

const fixedNow = new Date("2026-08-14T20:00:00.000Z");
const fixedClock = () => fixedNow;

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

describeIntegration("PostgreSQL dashboard overview", () => {
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

  it("returns zeros and empty arrays when there is no data", async () => {
    const overview = await getDashboardOverview(repositories, fixedClock);

    expect(overview.totalMonitors).toBe(0);
    expect(overview.upMonitors).toBe(0);
    expect(overview.downMonitors).toBe(0);
    expect(overview.openIncidents).toBe(0);
    expect(overview.resolvedIncidents).toBe(0);
    expect(overview.totalAlerts).toBe(0);
    expect(overview.recentAlerts).toEqual([]);
    expect(overview.overallUptimePercentage).toBe(0);
    expect(overview.averageResponseTimeMs).toBe(0);
  });

  it("aggregates monitor counts and latest status from PostgreSQL", async () => {
    const upMonitor = await repositories.monitorRepository.create({
      name: "Up",
      url: "https://example.com/up",
    });
    const downMonitor = await repositories.monitorRepository.create({
      name: "Down",
      url: "https://example.com/down",
    });
    await repositories.monitorRepository.create({
      name: "No checks",
      url: "https://example.com/none",
    });

    await repositories.checkHistoryRepository.add(
      createStoredCheck(upMonitor.id, {
        status: "up",
        checkedAt: "2026-08-14T19:00:00.000Z",
      }),
    );
    await repositories.checkHistoryRepository.add(
      createStoredCheck(downMonitor.id, {
        status: "down",
        checkedAt: "2026-08-14T19:00:00.000Z",
      }),
    );

    const overview = await getDashboardOverview(repositories, fixedClock);

    expect(overview.totalMonitors).toBe(3);
    expect(overview.upMonitors).toBe(1);
    expect(overview.downMonitors).toBe(1);
  });

  it("aggregates incident counts from PostgreSQL", async () => {
    const monitorA = await repositories.monitorRepository.create({
      name: "A",
      url: "https://example.com/a",
    });
    const monitorB = await repositories.monitorRepository.create({
      name: "B",
      url: "https://example.com/b",
    });

    await repositories.incidentRepository.create({
      monitorId: monitorA.id,
      startedAt: "2026-08-14T18:00:00.000Z",
    });
    await repositories.incidentRepository.create({
      monitorId: monitorB.id,
      startedAt: "2026-08-14T18:00:10.000Z",
    });
    await repositories.incidentRepository.resolveOpenIncident(
      monitorB.id,
      "2026-08-14T18:00:20.000Z",
    );

    const overview = await getDashboardOverview(repositories, fixedClock);

    expect(overview.openIncidents).toBe(1);
    expect(overview.resolvedIncidents).toBe(1);
  });

  it("aggregates alerts and limits recent alerts from PostgreSQL", async () => {
    const monitor = await repositories.monitorRepository.create({
      name: "Alerts",
      url: "https://example.com/alerts",
    });
    const incident = await repositories.incidentRepository.create({
      monitorId: monitor.id,
      startedAt: "2026-08-14T18:00:00.000Z",
    });

    for (let index = 0; index < 12; index += 1) {
      await repositories.alertRepository.add({
        monitorId: monitor.id,
        incidentId: incident.id,
        type: "incident_opened",
        createdAt: `2026-08-14T18:${String(index).padStart(2, "0")}:00.000Z`,
      });
    }

    const overview = await getDashboardOverview(repositories, fixedClock);

    expect(overview.totalAlerts).toBe(12);
    expect(overview.recentAlerts).toHaveLength(DASHBOARD_RECENT_ALERTS_LIMIT);
    expect(overview.recentAlerts[0]?.createdAt).toBe(
      "2026-08-14T18:11:00.000Z",
    );
  });

  it("aggregates uptime and average response time from PostgreSQL", async () => {
    const monitor = await repositories.monitorRepository.create({
      name: "Metrics",
      url: "https://example.com/metrics",
    });

    await repositories.checkHistoryRepository.add(
      createStoredCheck(monitor.id, {
        status: "up",
        responseTimeMs: 100,
        checkedAt: "2026-08-14T18:00:00.000Z",
      }),
    );
    await repositories.checkHistoryRepository.add(
      createStoredCheck(monitor.id, {
        status: "up",
        responseTimeMs: 200,
        checkedAt: "2026-08-14T19:00:00.000Z",
      }),
    );
    await repositories.checkHistoryRepository.add(
      createStoredCheck(monitor.id, {
        status: "down",
        responseTimeMs: 300,
        checkedAt: "2026-08-14T19:30:00.000Z",
      }),
    );

    const overview = await getDashboardOverview(repositories, fixedClock);

    expect(overview.overallUptimePercentage).toBe(66.67);
    expect(overview.averageResponseTimeMs).toBe(200);
    expect(overview.from).toBe("2026-08-13T20:00:00.000Z");
    expect(overview.to).toBe("2026-08-14T20:00:00.000Z");
  });
});
