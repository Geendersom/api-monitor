import type { FastifyInstance } from "fastify";

import type { AlertStore } from "./alerts.js";
import type { HealthCheckOptions } from "./check.js";
import type { CheckHistoryStore } from "./history.js";
import type { IncidentStore } from "./incidents.js";
import { runMonitorCheck } from "./run-check.js";
import { calculateMonitorStats } from "./stats.js";
import type { MonitorStore } from "./store.js";
import { validateCreateMonitorBody } from "./validation.js";

export const registerMonitorRoutes = (
  app: FastifyInstance,
  store: MonitorStore,
  historyStore: CheckHistoryStore,
  incidentStore: IncidentStore,
  alertStore: AlertStore,
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

  app.get("/alerts", async () => {
    return {
      alerts: alertStore.listAll(),
    };
  });

  app.get<{ Params: { id: string } }>(
    "/monitors/:id/check",
    async (request, reply) => {
      const monitor = store.findById(request.params.id);

      if (!monitor) {
        return reply.status(404).send({ error: "Monitor not found" });
      }

      const result = await runMonitorCheck(
        monitor,
        historyStore,
        incidentStore,
        alertStore,
        healthCheckOptions,
      );

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
    "/monitors/:id/stats",
    async (request, reply) => {
      const monitor = store.findById(request.params.id);

      if (!monitor) {
        return reply.status(404).send({ error: "Monitor not found" });
      }

      const checks = historyStore.findByMonitorId(monitor.id);

      return calculateMonitorStats(monitor.id, checks);
    },
  );

  app.get<{ Params: { id: string } }>(
    "/monitors/:id/incidents",
    async (request, reply) => {
      const monitor = store.findById(request.params.id);

      if (!monitor) {
        return reply.status(404).send({ error: "Monitor not found" });
      }

      return {
        incidents: incidentStore.findByMonitorId(monitor.id),
      };
    },
  );

  app.get<{ Params: { id: string } }>(
    "/monitors/:id/alerts",
    async (request, reply) => {
      const monitor = store.findById(request.params.id);

      if (!monitor) {
        return reply.status(404).send({ error: "Monitor not found" });
      }

      return {
        alerts: alertStore.findByMonitorId(monitor.id),
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
