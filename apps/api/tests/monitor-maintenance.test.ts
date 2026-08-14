import { randomUUID } from "node:crypto";

import type { FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildApp } from "../src/app.js";
import {
  IncidentStore,
  processMonitorResult,
} from "../src/monitors/incidents.js";
import {
  isMaintenanceActiveAt,
  isMaintenanceEnded,
  isMaintenanceScheduled,
  isWithinMaintenanceWindow,
  maintenanceWindowsOverlap,
  validateCreateMaintenanceBody,
  type MaintenanceWindow,
} from "../src/monitors/maintenance.js";
import { MaintenanceStore } from "../src/monitors/maintenance-store.js";

const monitorId = "00000000-0000-0000-0000-000000000001";
const otherMonitorId = "00000000-0000-0000-0000-000000000002";

const createWindow = (
  overrides: Partial<MaintenanceWindow> = {},
): MaintenanceWindow => ({
  id: randomUUID(),
  monitorId,
  title: "Planned maintenance",
  startsAt: "2026-08-20T02:00:00.000Z",
  endsAt: "2026-08-20T03:00:00.000Z",
  createdAt: "2026-08-19T12:00:00.000Z",
  ...overrides,
});

describe("validateCreateMaintenanceBody", () => {
  it("accepts a valid maintenance payload", () => {
    const validation = validateCreateMaintenanceBody({
      title: "Atualização de infraestrutura",
      reason: "Manutenção programada do servidor",
      startsAt: "2026-08-20T02:00:00.000Z",
      endsAt: "2026-08-20T03:00:00.000Z",
    });

    expect(validation.success).toBe(true);
  });

  it("requires a non-empty title", () => {
    const validation = validateCreateMaintenanceBody({
      title: "   ",
      startsAt: "2026-08-20T02:00:00.000Z",
      endsAt: "2026-08-20T03:00:00.000Z",
    });

    expect(validation).toEqual({
      success: false,
      error: "title must be a non-empty string",
    });
  });

  it("rejects invalid startsAt", () => {
    const validation = validateCreateMaintenanceBody({
      title: "Maintenance",
      startsAt: "invalid",
      endsAt: "2026-08-20T03:00:00.000Z",
    });

    expect(validation).toEqual({
      success: false,
      error: "startsAt must be a valid ISO 8601 timestamp",
    });
  });

  it("rejects invalid endsAt", () => {
    const validation = validateCreateMaintenanceBody({
      title: "Maintenance",
      startsAt: "2026-08-20T02:00:00.000Z",
      endsAt: "invalid",
    });

    expect(validation).toEqual({
      success: false,
      error: "endsAt must be a valid ISO 8601 timestamp",
    });
  });

  it("rejects startsAt greater than or equal to endsAt", () => {
    const validation = validateCreateMaintenanceBody({
      title: "Maintenance",
      startsAt: "2026-08-20T03:00:00.000Z",
      endsAt: "2026-08-20T02:00:00.000Z",
    });

    expect(validation).toEqual({
      success: false,
      error: "startsAt must be before endsAt",
    });
  });
});

describe("maintenance window helpers", () => {
  const window = createWindow();

  it("detects scheduled future maintenance", () => {
    expect(isMaintenanceScheduled("2026-08-20T01:00:00.000Z", window)).toBe(
      true,
    );
  });

  it("detects active maintenance at the start boundary", () => {
    expect(isWithinMaintenanceWindow("2026-08-20T02:00:00.000Z", window)).toBe(
      true,
    );
  });

  it("detects active maintenance at the end boundary", () => {
    expect(isWithinMaintenanceWindow("2026-08-20T03:00:00.000Z", window)).toBe(
      true,
    );
  });

  it("detects timestamps before the window", () => {
    expect(isWithinMaintenanceWindow("2026-08-20T01:59:59.999Z", window)).toBe(
      false,
    );
  });

  it("detects timestamps after the window", () => {
    expect(isMaintenanceEnded("2026-08-20T03:00:00.001Z", window)).toBe(true);
  });

  it("detects overlapping windows", () => {
    expect(
      maintenanceWindowsOverlap(
        "2026-08-20T02:30:00.000Z",
        "2026-08-20T03:30:00.000Z",
        window.startsAt,
        window.endsAt,
      ),
    ).toBe(true);
  });

  it("allows adjacent non-overlapping windows", () => {
    expect(
      maintenanceWindowsOverlap(
        "2026-08-20T03:00:00.000Z",
        "2026-08-20T04:00:00.000Z",
        window.startsAt,
        window.endsAt,
      ),
    ).toBe(false);
  });

  it("keeps maintenance state isolated by monitor", () => {
    const windows = [
      createWindow({ monitorId }),
      createWindow({
        monitorId: otherMonitorId,
        startsAt: "2026-08-21T02:00:00.000Z",
        endsAt: "2026-08-21T03:00:00.000Z",
      }),
    ];

    expect(isMaintenanceActiveAt("2026-08-20T02:30:00.000Z", windows)).toBe(
      true,
    );
    expect(isMaintenanceActiveAt("2026-08-21T02:30:00.000Z", windows)).toBe(
      true,
    );
  });
});

describe("MaintenanceStore", () => {
  let maintenanceStore: MaintenanceStore;

  beforeEach(() => {
    maintenanceStore = new MaintenanceStore();
  });

  it("creates a valid maintenance window", async () => {
    const maintenance = await maintenanceStore.create({
      monitorId,
      title: "Upgrade",
      reason: "Database upgrade",
      startsAt: "2026-08-20T02:00:00.000Z",
      endsAt: "2026-08-20T03:00:00.000Z",
    });

    expect(maintenance.id).toBeTruthy();
    expect(maintenance.monitorId).toBe(monitorId);
    expect(maintenance.title).toBe("Upgrade");
    expect(maintenance.createdAt).toBeTruthy();
  });

  it("detects overlapping maintenance for the same monitor", async () => {
    await maintenanceStore.create({
      monitorId,
      title: "First",
      startsAt: "2026-08-20T02:00:00.000Z",
      endsAt: "2026-08-20T03:00:00.000Z",
    });

    const overlap = await maintenanceStore.hasOverlappingWindow(
      monitorId,
      "2026-08-20T02:30:00.000Z",
      "2026-08-20T03:30:00.000Z",
    );

    expect(overlap).toBe(true);
  });

  it("allows maintenance on different monitors", async () => {
    await maintenanceStore.create({
      monitorId,
      title: "Monitor A",
      startsAt: "2026-08-20T02:00:00.000Z",
      endsAt: "2026-08-20T03:00:00.000Z",
    });

    const overlap = await maintenanceStore.hasOverlappingWindow(
      otherMonitorId,
      "2026-08-20T02:00:00.000Z",
      "2026-08-20T03:00:00.000Z",
    );

    expect(overlap).toBe(false);
  });

  it("finds active maintenance at a timestamp", async () => {
    await maintenanceStore.create({
      monitorId,
      title: "Active",
      startsAt: "2026-08-20T02:00:00.000Z",
      endsAt: "2026-08-20T03:00:00.000Z",
    });

    const active = await maintenanceStore.findActiveAt(
      monitorId,
      "2026-08-20T02:30:00.000Z",
    );

    expect(active?.title).toBe("Active");
  });
});

describe("processMonitorResult during maintenance", () => {
  let incidentStore: IncidentStore;

  beforeEach(() => {
    incidentStore = new IncidentStore();
  });

  it("does not open incidents for DOWN checks during maintenance", async () => {
    const result = await processMonitorResult(
      {
        id: randomUUID(),
        monitorId,
        status: "down",
        responseTimeMs: 100,
        checkedAt: "2026-08-20T02:30:00.000Z",
      },
      incidentStore,
      { inMaintenance: true },
    );

    expect(result).toEqual({});
    expect(await incidentStore.findByMonitorId(monitorId)).toHaveLength(0);
  });

  it("does not resolve incidents for UP checks during maintenance", async () => {
    await processMonitorResult(
      {
        id: randomUUID(),
        monitorId,
        status: "down",
        responseTimeMs: 100,
        checkedAt: "2026-08-20T01:00:00.000Z",
      },
      incidentStore,
    );

    const result = await processMonitorResult(
      {
        id: randomUUID(),
        monitorId,
        status: "up",
        responseTimeMs: 100,
        checkedAt: "2026-08-20T02:30:00.000Z",
      },
      incidentStore,
      { inMaintenance: true },
    );

    expect(result).toEqual({});
    expect((await incidentStore.findByMonitorId(monitorId))[0]?.status).toBe(
      "open",
    );
  });
});

describe("Maintenance HTTP routes", () => {
  let app: FastifyInstance;
  let maintenanceStore: MaintenanceStore;

  beforeEach(async () => {
    maintenanceStore = new MaintenanceStore();
    app = buildApp({ maintenanceStore });
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
        name: "Maintenance Monitor",
        url: "https://example.com/health",
      },
    });

    return response.json<{ id: string }>();
  };

  it("creates maintenance with HTTP 201", async () => {
    const monitor = await createMonitor();

    const response = await app.inject({
      method: "POST",
      url: `/monitors/${monitor.id}/maintenance`,
      payload: {
        title: "Atualização de infraestrutura",
        reason: "Manutenção programada do servidor",
        startsAt: "2026-08-20T02:00:00.000Z",
        endsAt: "2026-08-20T03:00:00.000Z",
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      monitorId: monitor.id,
      title: "Atualização de infraestrutura",
    });
  });

  it("lists maintenance windows", async () => {
    const monitor = await createMonitor();

    await app.inject({
      method: "POST",
      url: `/monitors/${monitor.id}/maintenance`,
      payload: {
        title: "First",
        startsAt: "2026-08-20T04:00:00.000Z",
        endsAt: "2026-08-20T05:00:00.000Z",
      },
    });
    await app.inject({
      method: "POST",
      url: `/monitors/${monitor.id}/maintenance`,
      payload: {
        title: "Second",
        startsAt: "2026-08-20T02:00:00.000Z",
        endsAt: "2026-08-20T03:00:00.000Z",
      },
    });

    const response = await app.inject({
      method: "GET",
      url: `/monitors/${monitor.id}/maintenance`,
    });

    const body = response.json<{
      maintenance: Array<{ title: string }>;
    }>();

    expect(body.maintenance.map((item) => item.title)).toEqual([
      "Second",
      "First",
    ]);
  });

  it("returns active maintenance when present", async () => {
    const monitor = await createMonitor();
    const now = Date.now();

    await maintenanceStore.create({
      monitorId: monitor.id,
      title: "Active now",
      startsAt: new Date(now - 60_000).toISOString(),
      endsAt: new Date(now + 60_000).toISOString(),
    });

    const response = await app.inject({
      method: "GET",
      url: `/monitors/${monitor.id}/maintenance/active`,
    });

    expect(response.json()).toEqual({
      active: true,
      maintenance: expect.objectContaining({ title: "Active now" }),
    });
  });

  it("returns inactive maintenance when none is active", async () => {
    const monitor = await createMonitor();

    const response = await app.inject({
      method: "GET",
      url: `/monitors/${monitor.id}/maintenance/active`,
    });

    expect(response.json()).toEqual({
      active: false,
      maintenance: null,
    });
  });

  it("deletes maintenance with HTTP 204", async () => {
    const monitor = await createMonitor();
    const created = await app.inject({
      method: "POST",
      url: `/monitors/${monitor.id}/maintenance`,
      payload: {
        title: "Delete me",
        startsAt: "2026-08-20T02:00:00.000Z",
        endsAt: "2026-08-20T03:00:00.000Z",
      },
    });
    const maintenanceId = created.json<{ id: string }>().id;

    const response = await app.inject({
      method: "DELETE",
      url: `/monitors/${monitor.id}/maintenance/${maintenanceId}`,
    });

    expect(response.statusCode).toBe(204);
  });

  it("returns HTTP 404 for unknown monitor", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/monitors/00000000-0000-0000-0000-000000000000/maintenance",
    });

    expect(response.statusCode).toBe(404);
  });

  it("returns HTTP 400 for invalid payload", async () => {
    const monitor = await createMonitor();

    const response = await app.inject({
      method: "POST",
      url: `/monitors/${monitor.id}/maintenance`,
      payload: {
        title: "Invalid",
        startsAt: "2026-08-20T03:00:00.000Z",
        endsAt: "2026-08-20T02:00:00.000Z",
      },
    });

    expect(response.statusCode).toBe(400);
  });

  it("returns HTTP 409 for overlapping maintenance", async () => {
    const monitor = await createMonitor();

    await app.inject({
      method: "POST",
      url: `/monitors/${monitor.id}/maintenance`,
      payload: {
        title: "Existing",
        startsAt: "2026-08-20T02:00:00.000Z",
        endsAt: "2026-08-20T03:00:00.000Z",
      },
    });

    const response = await app.inject({
      method: "POST",
      url: `/monitors/${monitor.id}/maintenance`,
      payload: {
        title: "Overlap",
        startsAt: "2026-08-20T02:30:00.000Z",
        endsAt: "2026-08-20T03:30:00.000Z",
      },
    });

    expect(response.statusCode).toBe(409);
  });

  it("returns HTTP 404 when deleting maintenance from another monitor", async () => {
    const monitorA = await createMonitor();
    const monitorB = await createMonitor();
    const created = await app.inject({
      method: "POST",
      url: `/monitors/${monitorA.id}/maintenance`,
      payload: {
        title: "Monitor A",
        startsAt: "2026-08-20T02:00:00.000Z",
        endsAt: "2026-08-20T03:00:00.000Z",
      },
    });
    const maintenanceId = created.json<{ id: string }>().id;

    const response = await app.inject({
      method: "DELETE",
      url: `/monitors/${monitorB.id}/maintenance/${maintenanceId}`,
    });

    expect(response.statusCode).toBe(404);
  });
});
