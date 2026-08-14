import type { FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildApp } from "../src/app.js";
import { createTestHttpServer } from "./helpers/test-server.js";

describe("GET /monitors/:id/checks", () => {
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

  it("stores an UP check result", async () => {
    const server = await createTestHttpServer((_request, response) => {
      response.writeHead(200);
      response.end("ok");
    });

    try {
      const monitor = await createMonitor(
        "Healthy Monitor",
        `${server.url}/health`,
      );

      await app.inject({
        method: "GET",
        url: `/monitors/${monitor.id}/check`,
      });

      const historyResponse = await app.inject({
        method: "GET",
        url: `/monitors/${monitor.id}/checks`,
      });

      expect(historyResponse.statusCode).toBe(200);

      const body = historyResponse.json<{
        checks: Array<{
          id: string;
          monitorId: string;
          status: string;
          statusCode?: number;
          responseTimeMs: number;
          checkedAt: string;
        }>;
      }>();

      expect(body.checks).toHaveLength(1);
      expect(body.checks[0]?.monitorId).toBe(monitor.id);
      expect(body.checks[0]?.status).toBe("up");
      expect(body.checks[0]?.statusCode).toBe(200);
      expect(typeof body.checks[0]?.responseTimeMs).toBe("number");
      expect(body.checks[0]?.checkedAt).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/,
      );
    } finally {
      await server.close();
    }
  });

  it("stores a DOWN check result", async () => {
    const server = await createTestHttpServer((_request, response) => {
      response.writeHead(500);
      response.end("error");
    });

    try {
      const monitor = await createMonitor(
        "Unhealthy Monitor",
        `${server.url}/health`,
      );

      await app.inject({
        method: "GET",
        url: `/monitors/${monitor.id}/check`,
      });

      const historyResponse = await app.inject({
        method: "GET",
        url: `/monitors/${monitor.id}/checks`,
      });

      const body = historyResponse.json<{
        checks: Array<{
          status: string;
          statusCode?: number;
          error?: string;
        }>;
      }>();

      expect(body.checks).toHaveLength(1);
      expect(body.checks[0]?.status).toBe("down");
      expect(body.checks[0]?.statusCode).toBe(500);
      expect(body.checks[0]?.error).toBeUndefined();
    } finally {
      await server.close();
    }
  });

  it("returns stored checks in history", async () => {
    const server = await createTestHttpServer((_request, response) => {
      response.writeHead(200);
      response.end("ok");
    });

    try {
      const monitor = await createMonitor(
        "History Monitor",
        `${server.url}/health`,
      );

      await app.inject({
        method: "GET",
        url: `/monitors/${monitor.id}/check`,
      });

      const historyResponse = await app.inject({
        method: "GET",
        url: `/monitors/${monitor.id}/checks`,
      });

      expect(historyResponse.statusCode).toBe(200);
      expect(historyResponse.json<{ checks: unknown[] }>().checks).toHaveLength(
        1,
      );
    } finally {
      await server.close();
    }
  });

  it("returns an empty list for an existing monitor without checks", async () => {
    const monitor = await createMonitor(
      "Empty History Monitor",
      "https://example.com/health",
    );

    const response = await app.inject({
      method: "GET",
      url: `/monitors/${monitor.id}/checks`,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ checks: [] });
  });

  it("returns HTTP 404 for a non-existent monitor", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/monitors/00000000-0000-0000-0000-000000000000/checks",
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({ error: "Monitor not found" });
  });

  it("keeps checks separated by monitor", async () => {
    const serverA = await createTestHttpServer((_request, response) => {
      response.writeHead(200);
      response.end("ok");
    });
    const serverB = await createTestHttpServer((_request, response) => {
      response.writeHead(500);
      response.end("error");
    });

    try {
      const monitorA = await createMonitor(
        "Monitor A",
        `${serverA.url}/health`,
      );
      const monitorB = await createMonitor(
        "Monitor B",
        `${serverB.url}/health`,
      );

      await app.inject({
        method: "GET",
        url: `/monitors/${monitorA.id}/check`,
      });
      await app.inject({
        method: "GET",
        url: `/monitors/${monitorB.id}/check`,
      });

      const historyA = await app.inject({
        method: "GET",
        url: `/monitors/${monitorA.id}/checks`,
      });
      const historyB = await app.inject({
        method: "GET",
        url: `/monitors/${monitorB.id}/checks`,
      });

      const checksA = historyA.json<{ checks: Array<{ status: string }> }>()
        .checks;
      const checksB = historyB.json<{ checks: Array<{ status: string }> }>()
        .checks;

      expect(checksA).toHaveLength(1);
      expect(checksA[0]?.status).toBe("up");
      expect(checksB).toHaveLength(1);
      expect(checksB[0]?.status).toBe("down");
    } finally {
      await serverA.close();
      await serverB.close();
    }
  });

  it("stores multiple checks for the same monitor", async () => {
    const server = await createTestHttpServer((_request, response) => {
      response.writeHead(200);
      response.end("ok");
    });

    try {
      const monitor = await createMonitor(
        "Repeated Monitor",
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
      await app.inject({
        method: "GET",
        url: `/monitors/${monitor.id}/check`,
      });

      const historyResponse = await app.inject({
        method: "GET",
        url: `/monitors/${monitor.id}/checks`,
      });

      const body = historyResponse.json<{
        checks: Array<{ id: string; monitorId: string }>;
      }>();

      expect(body.checks).toHaveLength(3);
      expect(new Set(body.checks.map((check) => check.id)).size).toBe(3);
      expect(body.checks.every((check) => check.monitorId === monitor.id)).toBe(
        true,
      );
    } finally {
      await server.close();
    }
  });
});
