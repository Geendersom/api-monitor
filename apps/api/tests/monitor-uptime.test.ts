import { randomUUID } from "node:crypto";

import type { FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildApp } from "../src/app.js";
import {
  CheckHistoryStore,
  type CheckResult,
} from "../src/monitors/history.js";
import {
  buildMonitorUptime,
  getMonitorUptime,
  parseUptimePeriod,
  resolvePeriodBounds,
} from "../src/monitors/uptime.js";

const monitorId = "00000000-0000-0000-0000-000000000001";
const otherMonitorId = "00000000-0000-0000-0000-000000000002";
const fixedNow = new Date("2026-08-14T20:00:00.000Z");
const fixedClock = () => fixedNow;

const createCheck = (
  targetMonitorId: string,
  overrides: Partial<CheckResult> = {},
): CheckResult => ({
  id: randomUUID(),
  monitorId: targetMonitorId,
  status: "up",
  responseTimeMs: 100,
  checkedAt: "2026-08-14T19:00:00.000Z",
  ...overrides,
});

describe("parseUptimePeriod", () => {
  it("accepts supported periods", () => {
    expect(parseUptimePeriod("24h")).toBe("24h");
    expect(parseUptimePeriod("7d")).toBe("7d");
    expect(parseUptimePeriod("30d")).toBe("30d");
  });

  it("rejects invalid periods", () => {
    expect(parseUptimePeriod(undefined)).toBeNull();
    expect(parseUptimePeriod("1h")).toBeNull();
    expect(parseUptimePeriod("12h")).toBeNull();
    expect(parseUptimePeriod("90d")).toBeNull();
    expect(parseUptimePeriod("7dabc")).toBeNull();
  });
});

describe("resolvePeriodBounds", () => {
  it("resolves a 24h period", () => {
    expect(resolvePeriodBounds("24h", fixedNow)).toEqual({
      from: "2026-08-13T20:00:00.000Z",
      to: "2026-08-14T20:00:00.000Z",
    });
  });

  it("resolves a 7d period", () => {
    expect(resolvePeriodBounds("7d", fixedNow)).toEqual({
      from: "2026-08-07T20:00:00.000Z",
      to: "2026-08-14T20:00:00.000Z",
    });
  });

  it("resolves a 30d period", () => {
    expect(resolvePeriodBounds("30d", fixedNow)).toEqual({
      from: "2026-07-15T20:00:00.000Z",
      to: "2026-08-14T20:00:00.000Z",
    });
  });
});

describe("getMonitorUptime", () => {
  let checkHistoryStore: CheckHistoryStore;

  beforeEach(() => {
    checkHistoryStore = new CheckHistoryStore();
  });

  it("returns zeros when there are no checks in the period", async () => {
    const uptime = await getMonitorUptime(
      monitorId,
      "7d",
      checkHistoryStore.getUptimeStats.bind(checkHistoryStore),
      fixedClock,
    );

    expect(uptime).toEqual({
      monitorId,
      period: "7d",
      from: "2026-08-07T20:00:00.000Z",
      to: "2026-08-14T20:00:00.000Z",
      totalChecks: 0,
      successfulChecks: 0,
      failedChecks: 0,
      uptimePercentage: 0,
      averageResponseTimeMs: 0,
    });
  });

  it("calculates uptime for only UP checks", async () => {
    await checkHistoryStore.add(
      createCheck(monitorId, {
        status: "up",
        responseTimeMs: 120,
        checkedAt: "2026-08-14T19:00:00.000Z",
      }),
    );
    await checkHistoryStore.add(
      createCheck(monitorId, {
        status: "up",
        responseTimeMs: 180,
        checkedAt: "2026-08-14T19:30:00.000Z",
      }),
    );

    const uptime = await getMonitorUptime(
      monitorId,
      "24h",
      checkHistoryStore.getUptimeStats.bind(checkHistoryStore),
      fixedClock,
    );

    expect(uptime.totalChecks).toBe(2);
    expect(uptime.successfulChecks).toBe(2);
    expect(uptime.failedChecks).toBe(0);
    expect(uptime.uptimePercentage).toBe(100);
    expect(uptime.averageResponseTimeMs).toBe(150);
  });

  it("calculates uptime for only DOWN checks", async () => {
    await checkHistoryStore.add(
      createCheck(monitorId, {
        status: "down",
        responseTimeMs: 90,
        checkedAt: "2026-08-14T18:00:00.000Z",
      }),
    );

    const uptime = await getMonitorUptime(
      monitorId,
      "24h",
      checkHistoryStore.getUptimeStats.bind(checkHistoryStore),
      fixedClock,
    );

    expect(uptime.totalChecks).toBe(1);
    expect(uptime.successfulChecks).toBe(0);
    expect(uptime.failedChecks).toBe(1);
    expect(uptime.uptimePercentage).toBe(0);
    expect(uptime.averageResponseTimeMs).toBe(90);
  });

  it("calculates uptime for mixed UP and DOWN checks", async () => {
    await checkHistoryStore.add(
      createCheck(monitorId, {
        status: "up",
        responseTimeMs: 100,
        checkedAt: "2026-08-14T18:00:00.000Z",
      }),
    );
    await checkHistoryStore.add(
      createCheck(monitorId, {
        status: "down",
        responseTimeMs: 200,
        checkedAt: "2026-08-14T18:30:00.000Z",
      }),
    );
    await checkHistoryStore.add(
      createCheck(monitorId, {
        status: "down",
        responseTimeMs: 300,
        checkedAt: "2026-08-14T19:00:00.000Z",
      }),
    );

    const uptime = await getMonitorUptime(
      monitorId,
      "24h",
      checkHistoryStore.getUptimeStats.bind(checkHistoryStore),
      fixedClock,
    );

    expect(uptime.totalChecks).toBe(3);
    expect(uptime.successfulChecks).toBe(1);
    expect(uptime.failedChecks).toBe(2);
    expect(uptime.uptimePercentage).toBe(33.33);
    expect(uptime.averageResponseTimeMs).toBe(200);
  });

  it("rounds uptime and average response time to two decimals", () => {
    const uptime = buildMonitorUptime(
      monitorId,
      "7d",
      "2026-08-07T20:00:00.000Z",
      "2026-08-14T20:00:00.000Z",
      {
        totalChecks: 3,
        successfulChecks: 1,
        failedChecks: 2,
        averageResponseTimeMs: 133.3333333,
      },
    );

    expect(uptime.uptimePercentage).toBe(33.33);
    expect(uptime.averageResponseTimeMs).toBe(133.33);
  });

  it("ignores checks outside the selected period", async () => {
    await checkHistoryStore.add(
      createCheck(monitorId, {
        status: "up",
        checkedAt: "2026-08-13T19:59:59.999Z",
      }),
    );
    await checkHistoryStore.add(
      createCheck(monitorId, {
        status: "up",
        checkedAt: "2026-08-13T20:00:00.000Z",
      }),
    );
    await checkHistoryStore.add(
      createCheck(monitorId, {
        status: "down",
        checkedAt: "2026-08-14T20:00:00.000Z",
      }),
    );
    await checkHistoryStore.add(
      createCheck(monitorId, {
        status: "down",
        checkedAt: "2026-08-14T20:00:00.001Z",
      }),
    );

    const uptime = await getMonitorUptime(
      monitorId,
      "24h",
      checkHistoryStore.getUptimeStats.bind(checkHistoryStore),
      fixedClock,
    );

    expect(uptime.totalChecks).toBe(2);
    expect(uptime.successfulChecks).toBe(1);
    expect(uptime.failedChecks).toBe(1);
  });

  it("includes a check exactly at the start of the period", async () => {
    await checkHistoryStore.add(
      createCheck(monitorId, {
        status: "up",
        checkedAt: "2026-08-13T20:00:00.000Z",
      }),
    );

    const uptime = await getMonitorUptime(
      monitorId,
      "24h",
      checkHistoryStore.getUptimeStats.bind(checkHistoryStore),
      fixedClock,
    );

    expect(uptime.totalChecks).toBe(1);
  });

  it("includes a check exactly at the end of the period", async () => {
    await checkHistoryStore.add(
      createCheck(monitorId, {
        status: "up",
        checkedAt: "2026-08-14T20:00:00.000Z",
      }),
    );

    const uptime = await getMonitorUptime(
      monitorId,
      "24h",
      checkHistoryStore.getUptimeStats.bind(checkHistoryStore),
      fixedClock,
    );

    expect(uptime.totalChecks).toBe(1);
  });

  it("keeps uptime isolated by monitor", async () => {
    await checkHistoryStore.add(
      createCheck(monitorId, {
        status: "up",
        checkedAt: "2026-08-14T19:00:00.000Z",
      }),
    );
    await checkHistoryStore.add(
      createCheck(otherMonitorId, {
        status: "down",
        checkedAt: "2026-08-14T19:00:00.000Z",
      }),
    );

    const uptime = await getMonitorUptime(
      monitorId,
      "7d",
      checkHistoryStore.getUptimeStats.bind(checkHistoryStore),
      fixedClock,
    );

    expect(uptime.totalChecks).toBe(1);
    expect(uptime.successfulChecks).toBe(1);
    expect(uptime.failedChecks).toBe(0);
  });
});

describe("GET /monitors/:id/uptime", () => {
  let app: FastifyInstance;
  let checkHistoryStore: CheckHistoryStore;

  beforeEach(async () => {
    checkHistoryStore = new CheckHistoryStore();
    app = buildApp({ checkHistoryStore });
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  const createMonitor = async () => {
    const response = await app.inject({
      method: "POST",
      url: "/monitors",
      payload: {
        name: "Uptime Monitor",
        url: "https://example.com/health",
      },
    });

    return response.json<{ id: string }>();
  };

  it("returns HTTP 404 for a non-existent monitor", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/monitors/00000000-0000-0000-0000-000000000000/uptime?period=7d",
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({ error: "Monitor not found" });
  });

  it("returns HTTP 400 when period is missing", async () => {
    const monitor = await createMonitor();

    const response = await app.inject({
      method: "GET",
      url: `/monitors/${monitor.id}/uptime`,
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({ error: "Invalid period" });
  });

  it("returns HTTP 400 for an invalid period", async () => {
    const monitor = await createMonitor();

    const response = await app.inject({
      method: "GET",
      url: `/monitors/${monitor.id}/uptime?period=invalid`,
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({ error: "Invalid period" });
  });

  it("returns zeros for a monitor without checks in the period", async () => {
    const monitor = await createMonitor();

    const response = await app.inject({
      method: "GET",
      url: `/monitors/${monitor.id}/uptime?period=7d`,
    });

    expect(response.statusCode).toBe(200);

    const body = response.json<{
      monitorId: string;
      period: string;
      from: string;
      to: string;
      totalChecks: number;
      uptimePercentage: number;
      averageResponseTimeMs: number;
    }>();

    expect(body.monitorId).toBe(monitor.id);
    expect(body.period).toBe("7d");
    expect(body.totalChecks).toBe(0);
    expect(body.uptimePercentage).toBe(0);
    expect(body.averageResponseTimeMs).toBe(0);
    expect(body.from).toBeTruthy();
    expect(body.to).toBeTruthy();
  });
});
