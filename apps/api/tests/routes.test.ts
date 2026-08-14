import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildApp } from "../src/app.js";

describe("API routes", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe("GET /", () => {
    it("returns HTTP 200 with name and status", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/",
      });

      expect(response.statusCode).toBe(200);

      const body = response.json<{ name: string; status: string }>();

      expect(body.name).toBe("API Monitor");
      expect(body.status).toBe("online");
    });
  });

  describe("GET /health", () => {
    it("returns HTTP 200 with status ok", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/health",
      });

      expect(response.statusCode).toBe(200);

      const body = response.json<{ status: string }>();

      expect(body.status).toBe("ok");
    });
  });
});
