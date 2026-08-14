import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { Pool } from "pg";

import { createPool } from "../../src/db/client.js";
import { runMigrations } from "../../src/db/migrate.js";
import { createCheckResult } from "../../src/monitors/history.js";
import { DEFAULT_INCIDENT_REASON } from "../../src/monitors/incidents.js";
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

describeIntegration("PostgreSQL repositories", () => {
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

  it("creates a monitor", async () => {
    const monitor = await repositories.monitorRepository.create({
      name: "API",
      url: "https://example.com/health",
    });

    expect(monitor.id).toBeTruthy();
    expect(monitor.name).toBe("API");
    expect(monitor.url).toBe("https://example.com/health");
  });

  it("finds a monitor by id", async () => {
    const created = await repositories.monitorRepository.create({
      name: "API",
      url: "https://example.com/health",
    });

    const found = await repositories.monitorRepository.findById(created.id);

    expect(found).toEqual(created);
  });

  it("lists monitors", async () => {
    const first = await repositories.monitorRepository.create({
      name: "First",
      url: "https://example.com/first",
    });
    const second = await repositories.monitorRepository.create({
      name: "Second",
      url: "https://example.com/second",
    });

    const monitors = await repositories.monitorRepository.findAll();

    expect(monitors).toEqual([first, second]);
  });

  it("creates a check result", async () => {
    const monitor = await repositories.monitorRepository.create({
      name: "API",
      url: "https://example.com/health",
    });

    const check = createCheckResult(monitor.id, {
      status: "up",
      responseTimeMs: 120,
      statusCode: 200,
    });

    const saved = await repositories.checkHistoryRepository.add(check);

    expect(saved.id).toBe(check.id);
    expect(saved.monitorId).toBe(monitor.id);
    expect(saved.status).toBe("up");
  });

  it("finds check history by monitor", async () => {
    const monitor = await repositories.monitorRepository.create({
      name: "API",
      url: "https://example.com/health",
    });

    const first = createCheckResult(monitor.id, {
      status: "up",
      responseTimeMs: 100,
      statusCode: 200,
    });
    const second = createCheckResult(monitor.id, {
      status: "down",
      responseTimeMs: 150,
      statusCode: 500,
    });

    await repositories.checkHistoryRepository.add(first);
    await repositories.checkHistoryRepository.add(second);

    const checks = await repositories.checkHistoryRepository.findByMonitorId(
      monitor.id,
    );

    expect(checks).toHaveLength(2);
    expect(checks[0]?.id).toBe(first.id);
    expect(checks[1]?.id).toBe(second.id);
  });

  it("creates an incident", async () => {
    const monitor = await repositories.monitorRepository.create({
      name: "API",
      url: "https://example.com/health",
    });

    const incident = await repositories.incidentRepository.create({
      monitorId: monitor.id,
      startedAt: "2026-08-14T18:00:00.000Z",
    });

    expect(incident.status).toBe("open");
    expect(incident.reason).toBe(DEFAULT_INCIDENT_REASON);
  });

  it("finds an open incident", async () => {
    const monitor = await repositories.monitorRepository.create({
      name: "API",
      url: "https://example.com/health",
    });

    const created = await repositories.incidentRepository.create({
      monitorId: monitor.id,
      startedAt: "2026-08-14T18:00:00.000Z",
    });

    const open = await repositories.incidentRepository.findOpenByMonitorId(
      monitor.id,
    );

    expect(open).toEqual(created);
  });

  it("resolves an open incident", async () => {
    const monitor = await repositories.monitorRepository.create({
      name: "API",
      url: "https://example.com/health",
    });

    await repositories.incidentRepository.create({
      monitorId: monitor.id,
      startedAt: "2026-08-14T18:00:00.000Z",
    });

    const resolved = await repositories.incidentRepository.resolveOpenIncident(
      monitor.id,
      "2026-08-14T18:00:05.000Z",
    );

    expect(resolved?.status).toBe("resolved");
    expect(resolved?.resolvedAt).toBe("2026-08-14T18:00:05.000Z");
    expect(resolved?.durationMs).toBe(5000);
  });

  it("creates an alert event", async () => {
    const monitor = await repositories.monitorRepository.create({
      name: "API",
      url: "https://example.com/health",
    });
    const incident = await repositories.incidentRepository.create({
      monitorId: monitor.id,
      startedAt: "2026-08-14T18:00:00.000Z",
    });

    const alert = await repositories.alertRepository.add({
      monitorId: monitor.id,
      incidentId: incident.id,
      type: "incident_opened",
      createdAt: "2026-08-14T18:00:00.000Z",
    });

    expect(alert.type).toBe("incident_opened");
    expect(alert.message).toBe("Monitor incident opened");
  });

  it("finds alerts by monitor", async () => {
    const monitorA = await repositories.monitorRepository.create({
      name: "A",
      url: "https://example.com/a",
    });
    const monitorB = await repositories.monitorRepository.create({
      name: "B",
      url: "https://example.com/b",
    });
    const incidentA = await repositories.incidentRepository.create({
      monitorId: monitorA.id,
      startedAt: "2026-08-14T18:00:00.000Z",
    });
    const incidentB = await repositories.incidentRepository.create({
      monitorId: monitorB.id,
      startedAt: "2026-08-14T18:00:10.000Z",
    });

    await repositories.alertRepository.add({
      monitorId: monitorA.id,
      incidentId: incidentA.id,
      type: "incident_opened",
      createdAt: "2026-08-14T18:00:00.000Z",
    });
    await repositories.alertRepository.add({
      monitorId: monitorB.id,
      incidentId: incidentB.id,
      type: "incident_opened",
      createdAt: "2026-08-14T18:00:10.000Z",
    });

    const alerts = await repositories.alertRepository.findByMonitorId(
      monitorA.id,
    );

    expect(alerts).toHaveLength(1);
    expect(alerts[0]?.monitorId).toBe(monitorA.id);
  });
});
