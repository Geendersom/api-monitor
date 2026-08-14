import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { Pool } from "pg";

import { buildApp } from "../../src/app.js";
import { createPool } from "../../src/db/client.js";
import { runMigrations } from "../../src/db/migrate.js";
import { createPostgresRepositories } from "../../src/repositories/postgres/index.js";
import { createTestHttpServer } from "../helpers/test-server.js";

const databaseUrl = process.env.DATABASE_URL;
const describeIntegration = databaseUrl ? describe : describe.skip;

const truncateTables = async (pool: Pool): Promise<void> => {
  await pool.query(`
    TRUNCATE TABLE
      maintenance_windows,
      alert_events,
      incidents,
      check_results,
      monitors
    RESTART IDENTITY CASCADE
  `);
};

describeIntegration("Maintenance check integration", () => {
  let pool: Pool;

  beforeAll(async () => {
    pool = createPool(databaseUrl!);
    await runMigrations(pool);
  });

  beforeEach(async () => {
    await truncateTables(pool);
  });

  afterAll(async () => {
    await pool.end();
  });

  const createApp = () =>
    buildApp({
      repositories: createPostgresRepositories(pool),
    });

  it("scenario A: DOWN outside maintenance opens incident and alert", async () => {
    const app = createApp();
    await app.ready();

    const statusCode = 500;
    const server = await createTestHttpServer((_request, response) => {
      response.writeHead(statusCode);
      response.end("error");
    });

    try {
      const monitor = await app.inject({
        method: "POST",
        url: "/monitors",
        payload: {
          name: "Scenario A",
          url: `${server.url}/health`,
        },
      });
      const monitorId = monitor.json<{ id: string }>().id;

      await app.inject({
        method: "GET",
        url: `/monitors/${monitorId}/check`,
      });

      const incidents = await app.inject({
        method: "GET",
        url: `/monitors/${monitorId}/incidents`,
      });
      const alerts = await app.inject({
        method: "GET",
        url: `/monitors/${monitorId}/alerts`,
      });
      const checks = await app.inject({
        method: "GET",
        url: `/monitors/${monitorId}/checks`,
      });

      expect(checks.json<{ checks: unknown[] }>().checks).toHaveLength(1);
      expect(incidents.json<{ incidents: unknown[] }>().incidents).toHaveLength(
        1,
      );
      expect(alerts.json<{ alerts: unknown[] }>().alerts).toHaveLength(1);
    } finally {
      await app.close();
      await server.close();
    }
  });

  it("scenario B: DOWN during maintenance keeps check but skips incident and alert", async () => {
    const app = createApp();
    await app.ready();

    const statusCode = 500;
    const server = await createTestHttpServer((_request, response) => {
      response.writeHead(statusCode);
      response.end("error");
    });

    try {
      const monitor = await app.inject({
        method: "POST",
        url: "/monitors",
        payload: {
          name: "Scenario B",
          url: `${server.url}/health`,
        },
      });
      const monitorId = monitor.json<{ id: string }>().id;
      const now = Date.now();

      await app.inject({
        method: "POST",
        url: `/monitors/${monitorId}/maintenance`,
        payload: {
          title: "Planned downtime",
          startsAt: new Date(now - 60_000).toISOString(),
          endsAt: new Date(now + 60_000).toISOString(),
        },
      });

      await app.inject({
        method: "GET",
        url: `/monitors/${monitorId}/check`,
      });

      const incidents = await app.inject({
        method: "GET",
        url: `/monitors/${monitorId}/incidents`,
      });
      const alerts = await app.inject({
        method: "GET",
        url: `/monitors/${monitorId}/alerts`,
      });
      const checks = await app.inject({
        method: "GET",
        url: `/monitors/${monitorId}/checks`,
      });

      expect(checks.json<{ checks: unknown[] }>().checks).toHaveLength(1);
      expect(incidents.json<{ incidents: unknown[] }>().incidents).toHaveLength(
        0,
      );
      expect(alerts.json<{ alerts: unknown[] }>().alerts).toHaveLength(0);
    } finally {
      await app.close();
      await server.close();
    }
  });

  it("scenario C: DOWN after maintenance ends opens a new incident", async () => {
    const app = createApp();
    await app.ready();

    const statusCode = 500;
    const server = await createTestHttpServer((_request, response) => {
      response.writeHead(statusCode);
      response.end("error");
    });

    try {
      const monitor = await app.inject({
        method: "POST",
        url: "/monitors",
        payload: {
          name: "Scenario C",
          url: `${server.url}/health`,
        },
      });
      const monitorId = monitor.json<{ id: string }>().id;
      const now = Date.now();

      await app.inject({
        method: "POST",
        url: `/monitors/${monitorId}/maintenance`,
        payload: {
          title: "Past maintenance",
          startsAt: new Date(now - 120_000).toISOString(),
          endsAt: new Date(now - 60_000).toISOString(),
        },
      });

      await app.inject({
        method: "GET",
        url: `/monitors/${monitorId}/check`,
      });

      const incidents = await app.inject({
        method: "GET",
        url: `/monitors/${monitorId}/incidents`,
      });
      const alerts = await app.inject({
        method: "GET",
        url: `/monitors/${monitorId}/alerts`,
      });

      expect(incidents.json<{ incidents: unknown[] }>().incidents).toHaveLength(
        1,
      );
      expect(alerts.json<{ alerts: unknown[] }>().alerts).toHaveLength(1);
    } finally {
      await app.close();
      await server.close();
    }
  });

  it("scenario D: maintenance on monitor A does not suppress incidents on monitor B", async () => {
    const app = createApp();
    await app.ready();

    const statusCode = 500;
    const server = await createTestHttpServer((_request, response) => {
      response.writeHead(statusCode);
      response.end("error");
    });

    try {
      const monitorA = await app.inject({
        method: "POST",
        url: "/monitors",
        payload: {
          name: "Monitor A",
          url: `${server.url}/health-a`,
        },
      });
      const monitorB = await app.inject({
        method: "POST",
        url: "/monitors",
        payload: {
          name: "Monitor B",
          url: `${server.url}/health-b`,
        },
      });
      const monitorAId = monitorA.json<{ id: string }>().id;
      const monitorBId = monitorB.json<{ id: string }>().id;
      const now = Date.now();

      await app.inject({
        method: "POST",
        url: `/monitors/${monitorAId}/maintenance`,
        payload: {
          title: "Maintenance A",
          startsAt: new Date(now - 60_000).toISOString(),
          endsAt: new Date(now + 60_000).toISOString(),
        },
      });

      await app.inject({
        method: "GET",
        url: `/monitors/${monitorAId}/check`,
      });
      await app.inject({
        method: "GET",
        url: `/monitors/${monitorBId}/check`,
      });

      const incidentsA = await app.inject({
        method: "GET",
        url: `/monitors/${monitorAId}/incidents`,
      });
      const incidentsB = await app.inject({
        method: "GET",
        url: `/monitors/${monitorBId}/incidents`,
      });

      expect(
        incidentsA.json<{ incidents: unknown[] }>().incidents,
      ).toHaveLength(0);
      expect(
        incidentsB.json<{ incidents: unknown[] }>().incidents,
      ).toHaveLength(1);
    } finally {
      await app.close();
      await server.close();
    }
  });
});
