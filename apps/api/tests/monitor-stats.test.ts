import { randomUUID } from "node:crypto";

import type { FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildApp } from "../src/app.js";
import {
  CheckHistoryStore,
  type CheckResult,
} from "../src/monitors/history.js";
import { calculateMonitorStats } from "../src/monitors/stats.js";

const createCheck = (
  monitorId: string,
  overrides: Partial<CheckResult> = {},
): CheckResult => ({
  id: randomUUID(),
  monitorId,
  status: "up",
  responseTimeMs: 100,
  checkedAt: "2026-08-14T18:00:00.000Z",
  ...overrides,
});

describe("calculateMonitorStats", () => {
  const monitorId = "00000000-0000-0000-0000-000000000001";

  it("returns zeros when there are no checks", () => {
    expect(calculateMonitorStats(monitorId, [])).toEqual({
      monitorId,
      totalChecks: 0,
      successfulChecks: 0,
      failedChecks: 0,
      uptimePercentage: 0,
      averageResponseTimeMs: 0,
    });
  });

  it("calculates metrics for only UP checks", () => {
    const stats = calculateMonitorStats(monitorId, [
      createCheck(monitorId, { responseTimeMs: 100 }),
      createCheck(monitorId, { responseTimeMs: 200 }),
    ]);

    expect(stats.totalChecks).toBe(2);
    expect(stats.successfulChecks).toBe(2);
    expect(stats.failedChecks).toBe(0);
    expect(stats.uptimePercentage).toBe(100);
    expect(stats.averageResponseTimeMs).toBe(150);
  });

  it("calculates metrics for only DOWN checks", () => {
    const stats = calculateMonitorStats(monitorId, [
      createCheck(monitorId, { status: "down", responseTimeMs: 50 }),
      createCheck(monitorId, { status: "down", responseTimeMs: 70 }),
    ]);

    expect(stats.totalChecks).toBe(2);
    expect(stats.successfulChecks).toBe(0);
    expect(stats.failedChecks).toBe(2);
    expect(stats.uptimePercentage).toBe(0);
    expect(stats.averageResponseTimeMs).toBe(60);
  });

  it("calculates metrics for a mix of UP and DOWN checks", () => {
    const stats = calculateMonitorStats(monitorId, [
      createCheck(monitorId, { status: "up", responseTimeMs: 100 }),
      createCheck(monitorId, { status: "up", responseTimeMs: 200 }),
      createCheck(monitorId, { status: "down", responseTimeMs: 300 }),
    ]);

    expect(stats.totalChecks).toBe(3);
    expect(stats.successfulChecks).toBe(2);
    expect(stats.failedChecks).toBe(1);
    expect(stats.uptimePercentage).toBe(66.67);
    expect(stats.averageResponseTimeMs).toBe(200);
  });

  it("rounds uptimePercentage to two decimal places", () => {
    const stats = calculateMonitorStats(
      monitorId,
      Array.from({ length: 3 }, (_, index) =>
        createCheck(monitorId, {
          status: index < 2 ? "up" : "down",
          responseTimeMs: 100,
        }),
      ),
    );

    expect(stats.uptimePercentage).toBe(66.67);
  });

  it("rounds averageResponseTimeMs to two decimal places", () => {
    const stats = calculateMonitorStats(monitorId, [
      createCheck(monitorId, { responseTimeMs: 100 }),
      createCheck(monitorId, { responseTimeMs: 101 }),
      createCheck(monitorId, { responseTimeMs: 102 }),
    ]);

    expect(stats.averageResponseTimeMs).toBe(101);
  });
});

describe("GET /monitors/:id/stats", () => {
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

  const createMonitor = async (name: string, url: string) => {
    const response = await app.inject({
      method: "POST",
      url: "/monitors",
      payload: {
        name,
        url,
      },
    });

    return response.json<{ id: string; name: string; url: string }>();
  };

  it("returns zeros for a monitor without checks", async () => {
    const monitor = await createMonitor(
      "Empty Stats Monitor",
      "https://example.com/health",
    );

    const response = await app.inject({
      method: "GET",
      url: `/monitors/${monitor.id}/stats`,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      monitorId: monitor.id,
      totalChecks: 0,
      successfulChecks: 0,
      failedChecks: 0,
      uptimePercentage: 0,
      averageResponseTimeMs: 0,
    });
  });

  it("returns HTTP 404 for a non-existent monitor", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/monitors/00000000-0000-0000-0000-000000000000/stats",
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({ error: "Monitor not found" });
  });

  it("returns stats based on stored checks for the monitor", async () => {
    const monitor = await createMonitor(
      "Stats Monitor",
      "https://example.com/health",
    );

    await checkHistoryStore.add(
      createCheck(monitor.id, { status: "up", responseTimeMs: 100 }),
    );
    await checkHistoryStore.add(
      createCheck(monitor.id, { status: "up", responseTimeMs: 200 }),
    );
    await checkHistoryStore.add(
      createCheck(monitor.id, { status: "down", responseTimeMs: 300 }),
    );

    const response = await app.inject({
      method: "GET",
      url: `/monitors/${monitor.id}/stats`,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      monitorId: monitor.id,
      totalChecks: 3,
      successfulChecks: 2,
      failedChecks: 1,
      uptimePercentage: 66.67,
      averageResponseTimeMs: 200,
    });
  });

  it("does not include checks from other monitors", async () => {
    const monitorA = await createMonitor("Monitor A", "https://example.com/a");
    const monitorB = await createMonitor("Monitor B", "https://example.com/b");

    await checkHistoryStore.add(
      createCheck(monitorA.id, { status: "up", responseTimeMs: 100 }),
    );
    await checkHistoryStore.add(
      createCheck(monitorB.id, { status: "down", responseTimeMs: 500 }),
    );

    const response = await app.inject({
      method: "GET",
      url: `/monitors/${monitorA.id}/stats`,
    });

    expect(response.json()).toEqual({
      monitorId: monitorA.id,
      totalChecks: 1,
      successfulChecks: 1,
      failedChecks: 0,
      uptimePercentage: 100,
      averageResponseTimeMs: 100,
    });
  });

  it("considers multiple checks from the same monitor", async () => {
    const monitor = await createMonitor(
      "Repeated Stats Monitor",
      "https://example.com/health",
    );

    await checkHistoryStore.add(
      createCheck(monitor.id, { responseTimeMs: 120 }),
    );
    await checkHistoryStore.add(
      createCheck(monitor.id, { responseTimeMs: 180 }),
    );

    const response = await app.inject({
      method: "GET",
      url: `/monitors/${monitor.id}/stats`,
    });

    expect(response.json()).toEqual({
      monitorId: monitor.id,
      totalChecks: 2,
      successfulChecks: 2,
      failedChecks: 0,
      uptimePercentage: 100,
      averageResponseTimeMs: 150,
    });
  });
});
