import type { FastifyInstance } from "fastify";

import { performHealthCheck, type HealthCheckOptions } from "./check.js";
import { createCheckResult, type CheckHistoryStore } from "./history.js";
import type { MonitorStore } from "./store.js";
import { validateCreateMonitorBody } from "./validation.js";

export const registerMonitorRoutes = (
  app: FastifyInstance,
  store: MonitorStore,
  historyStore: CheckHistoryStore,
  healthCheckOptions: HealthCheckOptions = {},
): void => {
  app.post("/monitors", async (request, reply) => {
    const validation = validateCreateMonitorBody(request.body);

    if (!validation.success) {
      return reply.status(400).send({ error: validation.error });
    }

    const monitor = store.create(validation.data);

    return reply.status(201).send(monitor);
  });

  app.get("/monitors", async () => {
    return {
      monitors: store.findAll(),
    };
  });

  app.get<{ Params: { id: string } }>(
    "/monitors/:id/check",
    async (request, reply) => {
      const monitor = store.findById(request.params.id);

      if (!monitor) {
        return reply.status(404).send({ error: "Monitor not found" });
      }

      const result = await performHealthCheck(monitor.url, healthCheckOptions);

      historyStore.add(createCheckResult(monitor.id, result));

      return reply.status(200).send(result);
    },
  );

  app.get<{ Params: { id: string } }>(
    "/monitors/:id/checks",
    async (request, reply) => {
      const monitor = store.findById(request.params.id);

      if (!monitor) {
        return reply.status(404).send({ error: "Monitor not found" });
      }

      return {
        checks: historyStore.findByMonitorId(monitor.id),
      };
    },
  );

  app.get<{ Params: { id: string } }>(
    "/monitors/:id",
    async (request, reply) => {
      const monitor = store.findById(request.params.id);

      if (!monitor) {
        return reply.status(404).send({ error: "Monitor not found" });
      }

      return monitor;
    },
  );
};
