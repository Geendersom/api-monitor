import type { FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildApp } from "../src/app.js";
import { createTestHttpServer } from "./helpers/test-server.js";

const wait = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

describe("MonitorScheduler", () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = buildApp({
      scheduler: {
        intervalMs: 50,
      },
    });
    await app.ready();
  });

  afterEach(async () => {
    app.monitorScheduler.stop();
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

  it("starts and stops correctly", () => {
    expect(app.monitorScheduler.isStarted()).toBe(false);

    app.monitorScheduler.start();
    expect(app.monitorScheduler.isStarted()).toBe(true);

    app.monitorScheduler.stop();
    expect(app.monitorScheduler.isStarted()).toBe(false);
  });

  it("runs checks on the configured interval", async () => {
    const server = await createTestHttpServer((_request, response) => {
      response.writeHead(200);
      response.end("ok");
    });

    try {
      const monitor = await createMonitor(
        "Scheduled Monitor",
        `${server.url}/health`,
      );

      app.monitorScheduler.start();
      await wait(80);

      const historyResponse = await app.inject({
        method: "GET",
        url: `/monitors/${monitor.id}/checks`,
      });

      expect(historyResponse.json<{ checks: unknown[] }>().checks).toHaveLength(
        1,
      );
    } finally {
      await server.close();
    }
  });

  it("stores check results in history after a cycle", async () => {
    const server = await createTestHttpServer((_request, response) => {
      response.writeHead(200);
      response.end("ok");
    });

    try {
      const monitor = await createMonitor(
        "History Monitor",
        `${server.url}/health`,
      );

      await app.monitorScheduler.runCycle();

      const historyResponse = await app.inject({
        method: "GET",
        url: `/monitors/${monitor.id}/checks`,
      });

      const body = historyResponse.json<{
        checks: Array<{ status: string; statusCode?: number }>;
      }>();

      expect(body.checks).toHaveLength(1);
      expect(body.checks[0]?.status).toBe("up");
      expect(body.checks[0]?.statusCode).toBe(200);
    } finally {
      await server.close();
    }
  });

  it("includes monitors created after the scheduler started", async () => {
    const server = await createTestHttpServer((_request, response) => {
      response.writeHead(200);
      response.end("ok");
    });

    try {
      app.monitorScheduler.start();
      await app.monitorScheduler.runCycle();

      const monitor = await createMonitor(
        "Late Monitor",
        `${server.url}/health`,
      );

      await app.monitorScheduler.runCycle();

      const historyResponse = await app.inject({
        method: "GET",
        url: `/monitors/${monitor.id}/checks`,
      });

      expect(historyResponse.json<{ checks: unknown[] }>().checks).toHaveLength(
        1,
      );
    } finally {
      await server.close();
    }
  });

  it("continues processing other monitors when one fails", async () => {
    const healthyServer = await createTestHttpServer((_request, response) => {
      response.writeHead(200);
      response.end("ok");
    });
    const unhealthyServer = await createTestHttpServer((_request, response) => {
      response.writeHead(500);
      response.end("error");
    });

    try {
      const healthyMonitor = await createMonitor(
        "Healthy Monitor",
        `${healthyServer.url}/health`,
      );
      const unhealthyMonitor = await createMonitor(
        "Unhealthy Monitor",
        `${unhealthyServer.url}/health`,
      );

      await app.monitorScheduler.runCycle();

      const healthyHistory = await app.inject({
        method: "GET",
        url: `/monitors/${healthyMonitor.id}/checks`,
      });
      const unhealthyHistory = await app.inject({
        method: "GET",
        url: `/monitors/${unhealthyMonitor.id}/checks`,
      });

      expect(
        healthyHistory.json<{ checks: Array<{ status: string }> }>().checks[0]
          ?.status,
      ).toBe("up");
      expect(
        unhealthyHistory.json<{ checks: Array<{ status: string }> }>().checks[0]
          ?.status,
      ).toBe("down");
    } finally {
      await healthyServer.close();
      await unhealthyServer.close();
    }
  });

  it("does not run overlapping cycles", async () => {
    let activeChecks = 0;
    let maxActiveChecks = 0;

    const trackingApp = buildApp({
      healthCheck: {
        fetchFn: async () => {
          activeChecks += 1;
          maxActiveChecks = Math.max(maxActiveChecks, activeChecks);
          await wait(30);
          activeChecks -= 1;

          return new Response("ok", { status: 200 });
        },
      },
    });

    await trackingApp.ready();

    try {
      await trackingApp.inject({
        method: "POST",
        url: "/monitors",
        payload: {
          name: "Overlap Monitor",
          url: "https://example.com/health",
        },
      });

      const firstCycle = trackingApp.monitorScheduler.runCycle();
      const secondCycle = trackingApp.monitorScheduler.runCycle();

      await Promise.all([firstCycle, secondCycle]);

      expect(maxActiveChecks).toBe(1);
      expect(trackingApp.monitorScheduler.isCycleInProgress()).toBe(false);
    } finally {
      trackingApp.monitorScheduler.stop();
      await trackingApp.close();
    }
  });

  it("stops scheduled cycles after stop() is called", async () => {
    const server = await createTestHttpServer((_request, response) => {
      response.writeHead(200);
      response.end("ok");
    });

    try {
      const monitor = await createMonitor(
        "Stop Monitor",
        `${server.url}/health`,
      );

      app.monitorScheduler.start();
      await wait(80);

      const firstHistory = await app.inject({
        method: "GET",
        url: `/monitors/${monitor.id}/checks`,
      });

      expect(firstHistory.json<{ checks: unknown[] }>().checks).toHaveLength(1);

      app.monitorScheduler.stop();
      await wait(100);

      const secondHistory = await app.inject({
        method: "GET",
        url: `/monitors/${monitor.id}/checks`,
      });

      expect(secondHistory.json<{ checks: unknown[] }>().checks).toHaveLength(
        1,
      );
    } finally {
      await server.close();
    }
  });
});
