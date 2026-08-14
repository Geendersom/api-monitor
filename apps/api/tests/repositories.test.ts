import { beforeEach, describe, expect, it } from "vitest";

import { createCheckResult } from "../src/monitors/history.js";
import { DEFAULT_INCIDENT_REASON } from "../src/monitors/incidents.js";
import { createInMemoryRepositories } from "./helpers/in-memory-repositories.js";
import type { Repositories } from "../src/repositories/types.js";

describe("In-memory repositories", () => {
  let repositories: Repositories;

  beforeEach(() => {
    repositories = createInMemoryRepositories();
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

    expect(saved).toEqual(check);
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

    expect(checks).toEqual([first, second]);
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

describe("In-memory repositories isolation", () => {
  it("creates alerts with unique ids", async () => {
    const repositories = createInMemoryRepositories();
    const monitor = await repositories.monitorRepository.create({
      name: "API",
      url: "https://example.com/health",
    });
    const incident = await repositories.incidentRepository.create({
      monitorId: monitor.id,
      startedAt: "2026-08-14T18:00:00.000Z",
    });

    const first = await repositories.alertRepository.add({
      monitorId: monitor.id,
      incidentId: incident.id,
      type: "incident_opened",
      createdAt: "2026-08-14T18:00:00.000Z",
    });
    const second = await repositories.alertRepository.add({
      monitorId: monitor.id,
      incidentId: incident.id,
      type: "incident_resolved",
      createdAt: "2026-08-14T18:00:10.000Z",
    });

    expect(first.id).not.toBe(second.id);
    expect(first.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });
});
