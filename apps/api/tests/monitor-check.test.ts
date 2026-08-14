import type { FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildApp } from "../src/app.js";
import { createTestHttpServer } from "./helpers/test-server.js";

describe("GET /monitors/:id/check", () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = buildApp();
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  const createMonitor = async (url: string) => {
    const response = await app.inject({
      method: "POST",
      url: "/monitors",
      payload: {
        name: "Test Monitor",
        url,
      },
    });

    return response.json<{ id: string; name: string; url: string }>();
  };

  it("returns up for a healthy URL", async () => {
    const server = await createTestHttpServer((_request, response) => {
      response.writeHead(200);
      response.end("ok");
    });

    try {
      const monitor = await createMonitor(`${server.url}/health`);

      const response = await app.inject({
        method: "GET",
        url: `/monitors/${monitor.id}/check`,
      });

      expect(response.statusCode).toBe(200);

      const body = response.json<{
        status: string;
        statusCode: number;
        responseTimeMs: number;
      }>();

      expect(body.status).toBe("up");
      expect(body.statusCode).toBe(200);
      expect(typeof body.responseTimeMs).toBe("number");
    } finally {
      await server.close();
    }
  });

  it("returns down for an HTTP error response", async () => {
    const server = await createTestHttpServer((_request, response) => {
      response.writeHead(500);
      response.end("error");
    });

    try {
      const monitor = await createMonitor(`${server.url}/health`);

      const response = await app.inject({
        method: "GET",
        url: `/monitors/${monitor.id}/check`,
      });

      expect(response.statusCode).toBe(200);

      const body = response.json<{
        status: string;
        statusCode: number;
        responseTimeMs: number;
      }>();

      expect(body.status).toBe("down");
      expect(body.statusCode).toBe(500);
      expect(typeof body.responseTimeMs).toBe("number");
    } finally {
      await server.close();
    }
  });

  it("returns HTTP 404 for a non-existent monitor", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/monitors/00000000-0000-0000-0000-000000000000/check",
    });

    expect(response.statusCode).toBe(404);

    const body = response.json<{ error: string }>();

    expect(body.error).toBe("Monitor not found");
  });

  it("returns down on timeout", async () => {
    const server = await createTestHttpServer(() => {
      // Intentionally never respond.
    });

    const timeoutApp = buildApp({
      healthCheck: {
        timeoutMs: 100,
      },
    });

    await timeoutApp.ready();

    try {
      const createResponse = await timeoutApp.inject({
        method: "POST",
        url: "/monitors",
        payload: {
          name: "Timeout Monitor",
          url: `${server.url}/health`,
        },
      });

      const monitor = createResponse.json<{ id: string }>();

      const response = await timeoutApp.inject({
        method: "GET",
        url: `/monitors/${monitor.id}/check`,
      });

      expect(response.statusCode).toBe(200);

      const body = response.json<{
        status: string;
        responseTimeMs: number;
        error?: string;
      }>();

      expect(body.status).toBe("down");
      expect(typeof body.responseTimeMs).toBe("number");
      expect(body.error).toBe("Request timed out");
    } finally {
      await timeoutApp.close();
      await server.close();
    }
  });

  it("returns down on connection failure", async () => {
    const monitor = await createMonitor("http://127.0.0.1:1/health");

    const response = await app.inject({
      method: "GET",
      url: `/monitors/${monitor.id}/check`,
    });

    expect(response.statusCode).toBe(200);

    const body = response.json<{
      status: string;
      responseTimeMs: number;
      error?: string;
    }>();

    expect(body.status).toBe("down");
    expect(typeof body.responseTimeMs).toBe("number");
    expect(body.error).toBe("Connection failed");
  });
});
