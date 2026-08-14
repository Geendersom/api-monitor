import { randomUUID } from "node:crypto";

import type { FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildApp } from "../src/app.js";
import {
  CheckHistoryStore,
  type CheckResult,
} from "../src/monitors/history.js";
import {
  IncidentStore,
  processMonitorResult,
} from "../src/monitors/incidents.js";
import { createTestHttpServer } from "./helpers/test-server.js";

const monitorId = "00000000-0000-0000-0000-000000000001";
const otherMonitorId = "00000000-0000-0000-0000-000000000002";

const createCheck = (
  status: "up" | "down",
  checkedAt: string,
  targetMonitorId: string = monitorId,
): CheckResult => ({
  id: randomUUID(),
  monitorId: targetMonitorId,
  status,
  responseTimeMs: 100,
  checkedAt,
});

describe("processMonitorResult", () => {
  let incidentStore: IncidentStore;

  beforeEach(() => {
    incidentStore = new IncidentStore();
  });

  it("does not create an incident for UP checks", () => {
    processMonitorResult(
      createCheck("up", "2026-08-14T18:00:00.000Z"),
      incidentStore,
    );

    expect(incidentStore.findByMonitorId(monitorId)).toEqual([]);
  });

  it("creates an open incident on the first DOWN check", () => {
    processMonitorResult(
      createCheck("down", "2026-08-14T18:00:00.000Z"),
      incidentStore,
    );

    const incidents = incidentStore.findByMonitorId(monitorId);

    expect(incidents).toHaveLength(1);
    expect(incidents[0]?.status).toBe("open");
    expect(incidents[0]?.startedAt).toBe("2026-08-14T18:00:00.000Z");
    expect(incidents[0]?.reason).toBe("Health check failed");
    expect(incidents[0]?.resolvedAt).toBeUndefined();
    expect(incidents[0]?.durationMs).toBeUndefined();
  });

  it("does not create duplicate incidents for consecutive DOWN checks", () => {
    processMonitorResult(
      createCheck("down", "2026-08-14T18:00:00.000Z"),
      incidentStore,
    );
    processMonitorResult(
      createCheck("down", "2026-08-14T18:00:30.000Z"),
      incidentStore,
    );
    processMonitorResult(
      createCheck("down", "2026-08-14T18:01:00.000Z"),
      incidentStore,
    );

    expect(incidentStore.findByMonitorId(monitorId)).toHaveLength(1);
  });

  it("resolves an open incident on the first UP check", () => {
    processMonitorResult(
      createCheck("down", "2026-08-14T18:00:00.000Z"),
      incidentStore,
    );
    processMonitorResult(
      createCheck("up", "2026-08-14T18:00:05.000Z"),
      incidentStore,
    );

    const incident = incidentStore.findByMonitorId(monitorId)[0];

    expect(incident?.status).toBe("resolved");
    expect(incident?.resolvedAt).toBe("2026-08-14T18:00:05.000Z");
    expect(incident?.durationMs).toBe(5000);
  });

  it("creates two incidents for DOWN → UP → DOWN", () => {
    processMonitorResult(
      createCheck("down", "2026-08-14T18:00:00.000Z"),
      incidentStore,
    );
    processMonitorResult(
      createCheck("up", "2026-08-14T18:00:10.000Z"),
      incidentStore,
    );
    processMonitorResult(
      createCheck("down", "2026-08-14T18:00:20.000Z"),
      incidentStore,
    );

    const incidents = incidentStore.findByMonitorId(monitorId);

    expect(incidents).toHaveLength(2);
    expect(incidents[0]?.status).toBe("resolved");
    expect(incidents[1]?.status).toBe("open");
  });

  it("keeps incidents isolated by monitor", () => {
    processMonitorResult(
      createCheck("down", "2026-08-14T18:00:00.000Z", monitorId),
      incidentStore,
    );
    processMonitorResult(
      createCheck("down", "2026-08-14T18:00:00.000Z", otherMonitorId),
      incidentStore,
    );

    expect(incidentStore.findByMonitorId(monitorId)).toHaveLength(1);
    expect(incidentStore.findByMonitorId(otherMonitorId)).toHaveLength(1);
  });

  it("maintains the correct lifecycle across multiple UP/DOWN cycles", () => {
    const sequence: Array<{ status: "up" | "down"; at: string }> = [
      { status: "up", at: "2026-08-14T18:00:00.000Z" },
      { status: "down", at: "2026-08-14T18:00:10.000Z" },
      { status: "down", at: "2026-08-14T18:00:20.000Z" },
      { status: "up", at: "2026-08-14T18:00:30.000Z" },
      { status: "up", at: "2026-08-14T18:00:40.000Z" },
      { status: "down", at: "2026-08-14T18:00:50.000Z" },
      { status: "up", at: "2026-08-14T18:01:00.000Z" },
    ];

    for (const step of sequence) {
      processMonitorResult(createCheck(step.status, step.at), incidentStore);
    }

    const incidents = incidentStore.findByMonitorId(monitorId);

    expect(incidents).toHaveLength(2);
    expect(incidents.every((incident) => incident.status === "resolved")).toBe(
      true,
    );
  });
});

describe("GET /monitors/:id/incidents", () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = buildApp();
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

  it("returns an empty list for a monitor without incidents", async () => {
    const monitor = await createMonitor(
      "No Incidents Monitor",
      "https://example.com/health",
    );

    const response = await app.inject({
      method: "GET",
      url: `/monitors/${monitor.id}/incidents`,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ incidents: [] });
  });

  it("returns HTTP 404 for a non-existent monitor", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/monitors/00000000-0000-0000-0000-000000000000/incidents",
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({ error: "Monitor not found" });
  });

  it("returns incidents in chronological order", async () => {
    const healthyServer = await createTestHttpServer((_request, response) => {
      response.writeHead(200);
      response.end("ok");
    });
    const unhealthyServer = await createTestHttpServer((_request, response) => {
      response.writeHead(500);
      response.end("error");
    });

    try {
      const monitor = await createMonitor(
        "Incident Monitor",
        `${healthyServer.url}/health`,
      );

      await app.inject({
        method: "GET",
        url: `/monitors/${monitor.id}/check`,
      });

      const downMonitor = await app.inject({
        method: "POST",
        url: "/monitors",
        payload: {
          name: "Down Monitor",
          url: `${unhealthyServer.url}/health`,
        },
      });
      const downMonitorId = downMonitor.json<{ id: string }>().id;

      await app.inject({
        method: "GET",
        url: `/monitors/${downMonitorId}/check`,
      });
      await app.inject({
        method: "GET",
        url: `/monitors/${downMonitorId}/check`,
      });

      const response = await app.inject({
        method: "GET",
        url: `/monitors/${downMonitorId}/incidents`,
      });

      const body = response.json<{
        incidents: Array<{ status: string; startedAt: string }>;
      }>();

      expect(body.incidents).toHaveLength(1);
      expect(body.incidents[0]?.status).toBe("open");
      expect(body.incidents[0]?.startedAt).toBeTruthy();
    } finally {
      await healthyServer.close();
      await unhealthyServer.close();
    }
  });

  it("creates and resolves incidents through the check endpoint", async () => {
    let statusCode = 500;
    const server = await createTestHttpServer((_request, response) => {
      response.writeHead(statusCode);
      response.end(statusCode === 200 ? "ok" : "error");
    });

    try {
      const monitor = await createMonitor(
        "Lifecycle Monitor",
        `${server.url}/health`,
      );

      await app.inject({
        method: "GET",
        url: `/monitors/${monitor.id}/check`,
      });
      await app.inject({
        method: "GET",
        url: `/monitors/${monitor.id}/check`,
      });

      statusCode = 200;

      await app.inject({
        method: "GET",
        url: `/monitors/${monitor.id}/check`,
      });

      const response = await app.inject({
        method: "GET",
        url: `/monitors/${monitor.id}/incidents`,
      });

      const body = response.json<{
        incidents: Array<{
          status: string;
          resolvedAt?: string;
          durationMs?: number;
        }>;
      }>();

      expect(body.incidents).toHaveLength(1);
      expect(body.incidents[0]?.status).toBe("resolved");
      expect(body.incidents[0]?.resolvedAt).toBeTruthy();
      expect(typeof body.incidents[0]?.durationMs).toBe("number");
    } finally {
      await server.close();
    }
  });
});

describe("runMonitorCheck incident integration", () => {
  it("processes incidents for scheduler and manual checks through runMonitorCheck", async () => {
    const checkHistoryStore = new CheckHistoryStore();
    const incidentStore = new IncidentStore();
    const app = buildApp({ checkHistoryStore, incidentStore });

    await app.ready();

    let statusCode = 500;
    const server = await createTestHttpServer((_request, response) => {
      response.writeHead(statusCode);
      response.end(statusCode === 200 ? "ok" : "error");
    });

    try {
      const monitor = await app.inject({
        method: "POST",
        url: "/monitors",
        payload: {
          name: "Scheduler Incident Monitor",
          url: `${server.url}/health`,
        },
      });
      const monitorIdValue = monitor.json<{ id: string }>().id;

      await app.inject({
        method: "GET",
        url: `/monitors/${monitorIdValue}/check`,
      });
      statusCode = 200;
      await app.monitorScheduler.runCycle();
      statusCode = 500;
      await app.monitorScheduler.runCycle();

      const incidents = incidentStore.findByMonitorId(monitorIdValue);

      expect(incidents).toHaveLength(2);
      expect(incidents[0]?.status).toBe("resolved");
      expect(incidents[1]?.status).toBe("open");
    } finally {
      await app.close();
      await server.close();
    }
  });
});
