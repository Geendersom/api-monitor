import { randomUUID } from "node:crypto";

import type { FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { buildApp } from "../src/app.js";
import {
  buildEmptyDashboardOverview,
  countMonitorsByLatestStatus,
  DASHBOARD_RECENT_ALERTS_LIMIT,
  DASHBOARD_UPTIME_PERIOD,
  getDashboardOverview,
  type DashboardOverview,
} from "../src/dashboard/overview.js";
import type { CheckResult } from "../src/monitors/history.js";
import { resolvePeriodBounds } from "../src/monitors/uptime.js";
import { createInMemoryRepositories } from "./helpers/in-memory-repositories.js";
import type { Repositories } from "../src/repositories/types.js";

const fixedNow = new Date("2026-08-14T20:00:00.000Z");
const fixedClock = () => fixedNow;

const createCheck = (
  monitorId: string,
  overrides: {
    status?: "up" | "down";
    responseTimeMs?: number;
    checkedAt?: string;
    statusCode?: number;
  } = {},
): CheckResult => ({
  id: randomUUID(),
  monitorId,
  status: overrides.status ?? "up",
  responseTimeMs: overrides.responseTimeMs ?? 100,
  checkedAt: overrides.checkedAt ?? "2026-08-14T19:00:00.000Z",
  statusCode: overrides.statusCode ?? 200,
});

describe("countMonitorsByLatestStatus", () => {
  it("counts up and down monitors", () => {
    expect(
      countMonitorsByLatestStatus([
        { status: "up" },
        { status: "up" },
        { status: "down" },
      ]),
    ).toEqual({
      upMonitors: 2,
      downMonitors: 1,
    });
  });

  it("returns zeros for an empty list", () => {
    expect(countMonitorsByLatestStatus([])).toEqual({
      upMonitors: 0,
      downMonitors: 0,
    });
  });
});

describe("buildEmptyDashboardOverview", () => {
  it("returns zeros and empty arrays with period metadata", () => {
    const { from, to } = resolvePeriodBounds(DASHBOARD_UPTIME_PERIOD, fixedNow);

    expect(buildEmptyDashboardOverview(from, to)).toEqual({
      totalMonitors: 0,
      upMonitors: 0,
      downMonitors: 0,
      openIncidents: 0,
      resolvedIncidents: 0,
      totalAlerts: 0,
      recentAlerts: [],
      overallUptimePercentage: 0,
      averageResponseTimeMs: 0,
      period: DASHBOARD_UPTIME_PERIOD,
      from,
      to,
    });
  });
});

describe("getDashboardOverview", () => {
  let repositories: Repositories;

  beforeEach(() => {
    repositories = createInMemoryRepositories();
  });

  it("returns zeros and empty arrays when there is no data", async () => {
    const overview = await getDashboardOverview(repositories, fixedClock);

    expect(overview).toEqual(
      buildEmptyDashboardOverview(
        resolvePeriodBounds(DASHBOARD_UPTIME_PERIOD, fixedNow).from,
        resolvePeriodBounds(DASHBOARD_UPTIME_PERIOD, fixedNow).to,
      ),
    );
  });

  it("counts total monitors", async () => {
    await repositories.monitorRepository.create({
      name: "First",
      url: "https://example.com/first",
    });
    await repositories.monitorRepository.create({
      name: "Second",
      url: "https://example.com/second",
    });

    const overview = await getDashboardOverview(repositories, fixedClock);

    expect(overview.totalMonitors).toBe(2);
  });

  it("counts up and down monitors by latest check status", async () => {
    const upMonitor = await repositories.monitorRepository.create({
      name: "Up",
      url: "https://example.com/up",
    });
    const downMonitor = await repositories.monitorRepository.create({
      name: "Down",
      url: "https://example.com/down",
    });

    await repositories.checkHistoryRepository.add(
      createCheck(upMonitor.id, {
        status: "down",
        checkedAt: "2026-08-14T18:00:00.000Z",
      }),
    );
    await repositories.checkHistoryRepository.add(
      createCheck(upMonitor.id, {
        status: "up",
        checkedAt: "2026-08-14T19:00:00.000Z",
      }),
    );
    await repositories.checkHistoryRepository.add(
      createCheck(downMonitor.id, {
        status: "down",
        checkedAt: "2026-08-14T19:00:00.000Z",
      }),
    );

    const overview = await getDashboardOverview(repositories, fixedClock);

    expect(overview.upMonitors).toBe(1);
    expect(overview.downMonitors).toBe(1);
  });

  it("does not count monitors without checks as up or down", async () => {
    await repositories.monitorRepository.create({
      name: "No checks",
      url: "https://example.com/none",
    });

    const overview = await getDashboardOverview(repositories, fixedClock);

    expect(overview.totalMonitors).toBe(1);
    expect(overview.upMonitors).toBe(0);
    expect(overview.downMonitors).toBe(0);
  });

  it("counts open and resolved incidents", async () => {
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

  it("counts total alerts", async () => {
    const monitor = await repositories.monitorRepository.create({
      name: "Alerts",
      url: "https://example.com/alerts",
    });
    const incident = await repositories.incidentRepository.create({
      monitorId: monitor.id,
      startedAt: "2026-08-14T18:00:00.000Z",
    });

    await repositories.alertRepository.add({
      monitorId: monitor.id,
      incidentId: incident.id,
      type: "incident_opened",
      createdAt: "2026-08-14T18:00:00.000Z",
    });
    await repositories.alertRepository.add({
      monitorId: monitor.id,
      incidentId: incident.id,
      type: "incident_resolved",
      createdAt: "2026-08-14T18:00:10.000Z",
    });

    const overview = await getDashboardOverview(repositories, fixedClock);

    expect(overview.totalAlerts).toBe(2);
  });

  it("returns recent alerts limited to the 10 most recent", async () => {
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

    expect(overview.recentAlerts).toHaveLength(DASHBOARD_RECENT_ALERTS_LIMIT);
    expect(overview.recentAlerts[0]?.createdAt).toBe(
      "2026-08-14T18:11:00.000Z",
    );
    expect(overview.recentAlerts.at(-1)?.createdAt).toBe(
      "2026-08-14T18:02:00.000Z",
    );
  });

  it("calculates overall uptime percentage for the last 24h", async () => {
    const monitor = await repositories.monitorRepository.create({
      name: "Uptime",
      url: "https://example.com/uptime",
    });

    await repositories.checkHistoryRepository.add(
      createCheck(monitor.id, {
        status: "up",
        checkedAt: "2026-08-14T18:00:00.000Z",
      }),
    );
    await repositories.checkHistoryRepository.add(
      createCheck(monitor.id, {
        status: "up",
        checkedAt: "2026-08-14T19:00:00.000Z",
      }),
    );
    await repositories.checkHistoryRepository.add(
      createCheck(monitor.id, {
        status: "up",
        checkedAt: "2026-08-14T19:30:00.000Z",
      }),
    );
    await repositories.checkHistoryRepository.add(
      createCheck(monitor.id, {
        status: "down",
        checkedAt: "2026-08-14T19:45:00.000Z",
      }),
    );

    const overview = await getDashboardOverview(repositories, fixedClock);

    expect(overview.overallUptimePercentage).toBe(75);
    expect(overview.period).toBe("24h");
    expect(overview.from).toBe("2026-08-13T20:00:00.000Z");
    expect(overview.to).toBe("2026-08-14T20:00:00.000Z");
  });

  it("calculates average response time for the last 24h", async () => {
    const monitor = await repositories.monitorRepository.create({
      name: "Latency",
      url: "https://example.com/latency",
    });

    await repositories.checkHistoryRepository.add(
      createCheck(monitor.id, {
        responseTimeMs: 100,
        checkedAt: "2026-08-14T18:00:00.000Z",
      }),
    );
    await repositories.checkHistoryRepository.add(
      createCheck(monitor.id, {
        responseTimeMs: 200,
        checkedAt: "2026-08-14T19:00:00.000Z",
      }),
    );
    await repositories.checkHistoryRepository.add(
      createCheck(monitor.id, {
        responseTimeMs: 300,
        checkedAt: "2026-08-14T19:30:00.000Z",
      }),
    );

    const overview = await getDashboardOverview(repositories, fixedClock);

    expect(overview.averageResponseTimeMs).toBe(200);
  });

  it("excludes checks outside the 24h period from uptime metrics", async () => {
    const monitor = await repositories.monitorRepository.create({
      name: "Window",
      url: "https://example.com/window",
    });

    await repositories.checkHistoryRepository.add(
      createCheck(monitor.id, {
        status: "down",
        checkedAt: "2026-08-13T19:59:59.999Z",
      }),
    );
    await repositories.checkHistoryRepository.add(
      createCheck(monitor.id, {
        status: "up",
        checkedAt: "2026-08-14T19:00:00.000Z",
      }),
    );

    const overview = await getDashboardOverview(repositories, fixedClock);

    expect(overview.overallUptimePercentage).toBe(100);
    expect(overview.averageResponseTimeMs).toBe(100);
  });

  it("keeps data isolated across monitors", async () => {
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

    await repositories.alertRepository.add({
      monitorId: monitorA.id,
      incidentId: incidentA.id,
      type: "incident_opened",
      createdAt: "2026-08-14T18:00:00.000Z",
    });
    await repositories.checkHistoryRepository.add(
      createCheck(monitorA.id, {
        status: "down",
        checkedAt: "2026-08-14T19:00:00.000Z",
      }),
    );
    await repositories.checkHistoryRepository.add(
      createCheck(monitorB.id, {
        status: "up",
        checkedAt: "2026-08-14T19:00:00.000Z",
      }),
    );

    const overview = await getDashboardOverview(repositories, fixedClock);

    expect(overview.totalMonitors).toBe(2);
    expect(overview.upMonitors).toBe(1);
    expect(overview.downMonitors).toBe(1);
    expect(overview.openIncidents).toBe(1);
    expect(overview.totalAlerts).toBe(1);
    expect(overview.recentAlerts).toHaveLength(1);
    expect(overview.recentAlerts[0]?.monitorId).toBe(monitorA.id);
  });
});

describe("GET /dashboard/overview", () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = buildApp();
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  it("returns HTTP 200 with dashboard overview shape", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/dashboard/overview",
    });

    expect(response.statusCode).toBe(200);

    const body = response.json<DashboardOverview>();

    expect(body).toMatchObject({
      totalMonitors: expect.any(Number),
      upMonitors: expect.any(Number),
      downMonitors: expect.any(Number),
      openIncidents: expect.any(Number),
      resolvedIncidents: expect.any(Number),
      totalAlerts: expect.any(Number),
      recentAlerts: expect.any(Array),
      overallUptimePercentage: expect.any(Number),
      averageResponseTimeMs: expect.any(Number),
      period: DASHBOARD_UPTIME_PERIOD,
      from: expect.any(String),
      to: expect.any(String),
    });
  });

  it("returns an empty dashboard when there is no data", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/dashboard/overview",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      totalMonitors: 0,
      upMonitors: 0,
      downMonitors: 0,
      openIncidents: 0,
      resolvedIncidents: 0,
      totalAlerts: 0,
      recentAlerts: [],
      overallUptimePercentage: 0,
      averageResponseTimeMs: 0,
      period: DASHBOARD_UPTIME_PERIOD,
    });
  });
});
