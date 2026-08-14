import { randomUUID } from "node:crypto";

import type { FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildApp } from "../src/app.js";
import {
  CheckHistoryStore,
  type CheckResult,
} from "../src/monitors/history.js";
import {
  DEFAULT_SLA_TARGET_PERCENTAGE,
  buildMonitorSla,
  calculateAllowedDowntimeMs,
  calculateExceededDowntimeMs,
  calculateObservedDowntimeMs,
  calculatePeriodDurationMs,
  determineSlaStatus,
  getMonitorSla,
} from "../src/monitors/sla.js";
import { DEFAULT_SCHEDULER_INTERVAL_MS } from "../src/monitors/scheduler.js";
import { resolvePeriodBounds } from "../src/monitors/uptime.js";

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

describe("calculateAllowedDowntimeMs", () => {
  it("calculates allowed downtime for a 24h period at 99.9%", () => {
    const { from, to } = resolvePeriodBounds("24h", fixedNow);
    const duration = calculatePeriodDurationMs(from, to);

    expect(calculateAllowedDowntimeMs(duration)).toBe(86_400);
  });

  it("calculates allowed downtime for a 7d period at 99.9%", () => {
    const { from, to } = resolvePeriodBounds("7d", fixedNow);
    const duration = calculatePeriodDurationMs(from, to);

    expect(calculateAllowedDowntimeMs(duration)).toBe(604_800);
  });

  it("calculates allowed downtime for a 30d period at 99.9%", () => {
    const { from, to } = resolvePeriodBounds("30d", fixedNow);
    const duration = calculatePeriodDurationMs(from, to);

    expect(calculateAllowedDowntimeMs(duration)).toBe(2_592_000);
  });
});

describe("calculateObservedDowntimeMs", () => {
  it("counts each DOWN check as one monitoring interval", () => {
    expect(calculateObservedDowntimeMs(0)).toBe(0);
    expect(calculateObservedDowntimeMs(1)).toBe(DEFAULT_SCHEDULER_INTERVAL_MS);
    expect(calculateObservedDowntimeMs(3)).toBe(
      3 * DEFAULT_SCHEDULER_INTERVAL_MS,
    );
  });
});

describe("determineSlaStatus", () => {
  it("returns compliant when observed downtime is below the limit", () => {
    expect(determineSlaStatus(30_000, 86_400)).toBe("compliant");
  });

  it("returns compliant when observed downtime is exactly at the limit", () => {
    expect(determineSlaStatus(86_400, 86_400)).toBe("compliant");
  });

  it("returns breached when observed downtime exceeds the limit", () => {
    expect(determineSlaStatus(90_000, 86_400)).toBe("breached");
  });
});

describe("calculateExceededDowntimeMs", () => {
  it("returns zero when within the allowed downtime", () => {
    expect(calculateExceededDowntimeMs(30_000, 86_400)).toBe(0);
  });

  it("returns the exceeded amount when above the limit", () => {
    expect(calculateExceededDowntimeMs(90_000, 86_400)).toBe(3_600);
  });
});

describe("buildMonitorSla", () => {
  const { from, to } = resolvePeriodBounds("24h", fixedNow);

  it("marks SLA as compliant when downtime is within 99.9%", () => {
    const sla = buildMonitorSla(monitorId, "24h", from, to, {
      totalChecks: 10,
      successfulChecks: 9,
      failedChecks: 1,
      averageResponseTimeMs: 100,
    });

    expect(sla.slaTargetPercentage).toBe(DEFAULT_SLA_TARGET_PERCENTAGE);
    expect(sla.downtimeMs).toBe(30_000);
    expect(sla.allowedDowntimeMs).toBe(86_400);
    expect(sla.exceededDowntimeMs).toBe(0);
    expect(sla.status).toBe("compliant");
    expect(sla.uptimePercentage).toBe(90);
  });

  it("marks SLA as breached when downtime exceeds the allowed budget", () => {
    const sla = buildMonitorSla(monitorId, "24h", from, to, {
      totalChecks: 10,
      successfulChecks: 0,
      failedChecks: 10,
      averageResponseTimeMs: 100,
    });

    expect(sla.downtimeMs).toBe(300_000);
    expect(sla.status).toBe("breached");
    expect(sla.exceededDowntimeMs).toBe(213_600);
  });

  it("returns compliant with zeros when there are no checks in the period", () => {
    const bounds = resolvePeriodBounds("7d", fixedNow);
    const sla = buildMonitorSla(monitorId, "7d", bounds.from, bounds.to, {
      totalChecks: 0,
      successfulChecks: 0,
      failedChecks: 0,
      averageResponseTimeMs: 0,
    });

    expect(sla.uptimePercentage).toBe(0);
    expect(sla.downtimeMs).toBe(0);
    expect(sla.exceededDowntimeMs).toBe(0);
    expect(sla.status).toBe("compliant");
  });

  it("rounds uptimePercentage to two decimals", () => {
    const sla = buildMonitorSla(monitorId, "24h", from, to, {
      totalChecks: 3,
      successfulChecks: 1,
      failedChecks: 2,
      averageResponseTimeMs: 100,
    });

    expect(sla.uptimePercentage).toBe(33.33);
  });
});

describe("getMonitorSla", () => {
  let checkHistoryStore: CheckHistoryStore;

  beforeEach(() => {
    checkHistoryStore = new CheckHistoryStore();
  });

  it("calculates SLA for a 24h period", async () => {
    await checkHistoryStore.add(
      createCheck(monitorId, {
        status: "down",
        checkedAt: "2026-08-14T19:00:00.000Z",
      }),
    );

    const sla = await getMonitorSla(
      monitorId,
      "24h",
      checkHistoryStore.getUptimeStats.bind(checkHistoryStore),
      fixedClock,
    );

    expect(sla.period).toBe("24h");
    expect(sla.from).toBe("2026-08-13T20:00:00.000Z");
    expect(sla.to).toBe("2026-08-14T20:00:00.000Z");
    expect(sla.status).toBe("compliant");
  });

  it("calculates SLA for a 7d period", async () => {
    const sla = await getMonitorSla(
      monitorId,
      "7d",
      checkHistoryStore.getUptimeStats.bind(checkHistoryStore),
      fixedClock,
    );

    expect(sla.period).toBe("7d");
    expect(sla.allowedDowntimeMs).toBe(604_800);
  });

  it("calculates SLA for a 30d period", async () => {
    const sla = await getMonitorSla(
      monitorId,
      "30d",
      checkHistoryStore.getUptimeStats.bind(checkHistoryStore),
      fixedClock,
    );

    expect(sla.period).toBe("30d");
    expect(sla.allowedDowntimeMs).toBe(2_592_000);
  });

  it("keeps SLA isolated by monitor", async () => {
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
    await checkHistoryStore.add(
      createCheck(otherMonitorId, {
        status: "down",
        checkedAt: "2026-08-14T19:30:00.000Z",
      }),
    );
    await checkHistoryStore.add(
      createCheck(otherMonitorId, {
        status: "down",
        checkedAt: "2026-08-14T20:00:00.000Z",
      }),
    );

    const sla = await getMonitorSla(
      monitorId,
      "24h",
      checkHistoryStore.getUptimeStats.bind(checkHistoryStore),
      fixedClock,
    );

    expect(sla.downtimeMs).toBe(0);
    expect(sla.uptimePercentage).toBe(100);
    expect(sla.status).toBe("compliant");
  });
});

describe("GET /monitors/:id/sla", () => {
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
        name: "SLA Monitor",
        url: "https://example.com/health",
      },
    });

    return response.json<{ id: string }>();
  };

  it("returns HTTP 404 for a non-existent monitor", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/monitors/00000000-0000-0000-0000-000000000000/sla?period=7d",
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({ error: "Monitor not found" });
  });

  it("returns HTTP 400 when period is missing", async () => {
    const monitor = await createMonitor();

    const response = await app.inject({
      method: "GET",
      url: `/monitors/${monitor.id}/sla`,
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({ error: "Invalid period" });
  });

  it("returns HTTP 400 for an invalid period", async () => {
    const monitor = await createMonitor();

    const response = await app.inject({
      method: "GET",
      url: `/monitors/${monitor.id}/sla?period=invalid`,
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({ error: "Invalid period" });
  });

  it("returns compliant SLA for a monitor without checks", async () => {
    const monitor = await createMonitor();

    const response = await app.inject({
      method: "GET",
      url: `/monitors/${monitor.id}/sla?period=24h`,
    });

    expect(response.statusCode).toBe(200);

    const body = response.json<{
      monitorId: string;
      period: string;
      uptimePercentage: number;
      downtimeMs: number;
      status: string;
    }>();

    expect(body.monitorId).toBe(monitor.id);
    expect(body.period).toBe("24h");
    expect(body.uptimePercentage).toBe(0);
    expect(body.downtimeMs).toBe(0);
    expect(body.status).toBe("compliant");
  });

  it("returns breached SLA when downtime exceeds the allowed budget", async () => {
    const monitor = await createMonitor();
    const now = Date.now();

    for (let index = 0; index < 4; index += 1) {
      await checkHistoryStore.add(
        createCheck(monitor.id, {
          status: "down",
          checkedAt: new Date(now - index * 60_000).toISOString(),
        }),
      );
    }

    const response = await app.inject({
      method: "GET",
      url: `/monitors/${monitor.id}/sla?period=24h`,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json<{ status: string; downtimeMs: number }>().status).toBe(
      "breached",
    );
    expect(response.json<{ downtimeMs: number }>().downtimeMs).toBe(120_000);
  });
});
