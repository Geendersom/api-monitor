import type { FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildApp } from "../src/app.js";

describe("Monitor routes", () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = buildApp();
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  describe("POST /monitors", () => {
    it("creates a monitor with HTTP 201", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/monitors",
        payload: {
          name: "Minha API",
          url: "https://example.com/health",
        },
      });

      expect(response.statusCode).toBe(201);

      const body = response.json<{ id: string; name: string; url: string }>();

      expect(body.id).toBeTruthy();
      expect(body.name).toBe("Minha API");
      expect(body.url).toBe("https://example.com/health");
    });

    it("returns an error for invalid payload", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/monitors",
        payload: {
          name: "",
          url: "not-a-valid-url",
        },
      });

      expect(response.statusCode).toBe(400);

      const body = response.json<{ error: string }>();

      expect(body.error).toBeTruthy();
    });
  });

  describe("GET /monitors", () => {
    it("returns a list containing a created monitor", async () => {
      const createResponse = await app.inject({
        method: "POST",
        url: "/monitors",
        payload: {
          name: "Minha API",
          url: "https://example.com/health",
        },
      });

      const createdMonitor = createResponse.json<{
        id: string;
        name: string;
        url: string;
      }>();

      const response = await app.inject({
        method: "GET",
        url: "/monitors",
      });

      expect(response.statusCode).toBe(200);

      const body = response.json<{
        monitors: Array<{ id: string; name: string; url: string }>;
      }>();

      expect(body.monitors).toHaveLength(1);
      expect(body.monitors[0]).toEqual(createdMonitor);
    });
  });

  describe("GET /monitors/:id", () => {
    it("returns an existing monitor", async () => {
      const createResponse = await app.inject({
        method: "POST",
        url: "/monitors",
        payload: {
          name: "Minha API",
          url: "https://example.com/health",
        },
      });

      const createdMonitor = createResponse.json<{
        id: string;
        name: string;
        url: string;
      }>();

      const response = await app.inject({
        method: "GET",
        url: `/monitors/${createdMonitor.id}`,
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual(createdMonitor);
    });

    it("returns HTTP 404 for a non-existent monitor", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/monitors/00000000-0000-0000-0000-000000000000",
      });

      expect(response.statusCode).toBe(404);

      const body = response.json<{ error: string }>();

      expect(body.error).toBe("Monitor not found");
    });
  });
});
