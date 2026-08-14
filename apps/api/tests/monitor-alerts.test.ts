import { randomUUID } from "node:crypto";

import type { FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildApp } from "../src/app.js";
import { AlertStore, processIncidentAlerts } from "../src/monitors/alerts.js";
import type { CheckResult } from "../src/monitors/history.js";
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

const processSequence = async (
  checks: CheckResult[],
  incidentStore: IncidentStore,
  alertStore: AlertStore,
) => {
  for (const check of checks) {
    const incidentResult = await processMonitorResult(check, incidentStore);

    await processIncidentAlerts(incidentResult, alertStore, check.checkedAt);
  }
};

describe("Alert Engine", () => {
  let incidentStore: IncidentStore;
  let alertStore: AlertStore;

  beforeEach(() => {
    incidentStore = new IncidentStore();
    alertStore = new AlertStore();
  });

  it("creates an incident_opened alert when a DOWN opens an incident", async () => {
    const check = createCheck("down", "2026-08-14T18:00:00.000Z");
    const incidentResult = await processMonitorResult(check, incidentStore);

    await processIncidentAlerts(incidentResult, alertStore, check.checkedAt);

    const alerts = await alertStore.listAll();

    expect(alerts).toHaveLength(1);
    expect(alerts[0]?.type).toBe("incident_opened");
    expect(alerts[0]?.message).toBe("Monitor incident opened");
  });

  it("does not create duplicate alerts for consecutive DOWN checks", async () => {
    await processSequence(
      [
        createCheck("down", "2026-08-14T18:00:00.000Z"),
        createCheck("down", "2026-08-14T18:00:30.000Z"),
        createCheck("down", "2026-08-14T18:01:00.000Z"),
      ],
      incidentStore,
      alertStore,
    );

    expect(await alertStore.listAll()).toHaveLength(1);
  });

  it("creates an incident_resolved alert when UP resolves an incident", async () => {
    await processSequence(
      [
        createCheck("down", "2026-08-14T18:00:00.000Z"),
        createCheck("up", "2026-08-14T18:00:05.000Z"),
      ],
      incidentStore,
      alertStore,
    );

    const alerts = await alertStore.listAll();

    expect(alerts).toHaveLength(2);
    expect(alerts[1]?.type).toBe("incident_resolved");
    expect(alerts[1]?.message).toBe("Monitor incident resolved");
  });

  it("creates the correct alerts for DOWN → UP → DOWN", async () => {
    await processSequence(
      [
        createCheck("down", "2026-08-14T18:00:00.000Z"),
        createCheck("up", "2026-08-14T18:00:10.000Z"),
        createCheck("down", "2026-08-14T18:00:20.000Z"),
      ],
      incidentStore,
      alertStore,
    );

    const alerts = await alertStore.listAll();

    expect(alerts).toHaveLength(3);
    expect(alerts.map((alert) => alert.type)).toEqual([
      "incident_opened",
      "incident_resolved",
      "incident_opened",
    ]);
  });

  it("keeps alerts isolated by monitor", async () => {
    await processSequence(
      [createCheck("down", "2026-08-14T18:00:00.000Z", monitorId)],
      incidentStore,
      alertStore,
    );
    await processSequence(
      [createCheck("down", "2026-08-14T18:00:00.000Z", otherMonitorId)],
      incidentStore,
      alertStore,
    );

    expect(await alertStore.findByMonitorId(monitorId)).toHaveLength(1);
    expect(await alertStore.findByMonitorId(otherMonitorId)).toHaveLength(1);
  });

  it("creates alerts with unique ids", async () => {
    await processSequence(
      [
        createCheck("down", "2026-08-14T18:00:00.000Z"),
        createCheck("up", "2026-08-14T18:00:10.000Z"),
        createCheck("down", "2026-08-14T18:00:20.000Z"),
      ],
      incidentStore,
      alertStore,
    );

    const ids = (await alertStore.listAll()).map((alert) => alert.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("creates alerts with valid ISO 8601 createdAt values", async () => {
    await processSequence(
      [createCheck("down", "2026-08-14T18:00:00.000Z")],
      incidentStore,
      alertStore,
    );

    expect((await alertStore.listAll())[0]?.createdAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/,
    );
  });

  it("uses only supported alert types", async () => {
    await processSequence(
      [
        createCheck("down", "2026-08-14T18:00:00.000Z"),
        createCheck("up", "2026-08-14T18:00:10.000Z"),
      ],
      incidentStore,
      alertStore,
    );

    for (const alert of await alertStore.listAll()) {
      expect(["incident_opened", "incident_resolved"]).toContain(alert.type);
    }
  });
});

describe("GET /alerts", () => {
  let app: FastifyInstance;
  let alertStore: AlertStore;

  beforeEach(async () => {
    alertStore = new AlertStore();
    app = buildApp({ alertStore });
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  it("returns all alert events", async () => {
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
          name: "Alert Monitor",
          url: `${server.url}/health`,
        },
      });
      const monitorIdValue = monitor.json<{ id: string }>().id;

      await app.inject({
        method: "GET",
        url: `/monitors/${monitorIdValue}/check`,
      });
      statusCode = 200;
      await app.inject({
        method: "GET",
        url: `/monitors/${monitorIdValue}/check`,
      });

      const response = await app.inject({
        method: "GET",
        url: "/alerts",
      });

      expect(response.statusCode).toBe(200);
      expect(response.json<{ alerts: unknown[] }>().alerts).toHaveLength(2);
    } finally {
      await server.close();
    }
  });
});

describe("GET /monitors/:id/alerts", () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = buildApp();
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  it("returns an empty list for a monitor without alerts", async () => {
    const monitor = await app.inject({
      method: "POST",
      url: "/monitors",
      payload: {
        name: "No Alerts Monitor",
        url: "https://example.com/health",
      },
    });
    const monitorIdValue = monitor.json<{ id: string }>().id;

    const response = await app.inject({
      method: "GET",
      url: `/monitors/${monitorIdValue}/alerts`,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ alerts: [] });
  });

  it("returns HTTP 404 for a non-existent monitor", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/monitors/00000000-0000-0000-0000-000000000000/alerts",
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({ error: "Monitor not found" });
  });

  it("returns only alerts for the requested monitor", async () => {
    const healthyServer = await createTestHttpServer((_request, response) => {
      response.writeHead(200);
      response.end("ok");
    });
    const unhealthyServer = await createTestHttpServer((_request, response) => {
      response.writeHead(500);
      response.end("error");
    });

    try {
      const monitorA = await app.inject({
        method: "POST",
        url: "/monitors",
        payload: {
          name: "Monitor A",
          url: `${healthyServer.url}/health`,
        },
      });
      const monitorB = await app.inject({
        method: "POST",
        url: "/monitors",
        payload: {
          name: "Monitor B",
          url: `${unhealthyServer.url}/health`,
        },
      });

      const monitorAId = monitorA.json<{ id: string }>().id;
      const monitorBId = monitorB.json<{ id: string }>().id;

      await app.inject({
        method: "GET",
        url: `/monitors/${monitorBId}/check`,
      });

      const response = await app.inject({
        method: "GET",
        url: `/monitors/${monitorAId}/alerts`,
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ alerts: [] });
    } finally {
      await healthyServer.close();
      await unhealthyServer.close();
    }
  });
});
