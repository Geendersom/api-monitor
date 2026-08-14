import type { FastifyInstance } from "fastify";

import type {
  AlertRepository,
  CheckHistoryRepository,
  IncidentRepository,
  MonitorRepository,
} from "../repositories/types.js";
import type { HealthCheckOptions } from "./check.js";
import { runMonitorCheck } from "./run-check.js";
import { calculateMonitorStats } from "./stats.js";
import { getMonitorSla } from "./sla.js";
import { getMonitorUptime, parseUptimePeriod } from "./uptime.js";
import { validateCreateMonitorBody } from "./validation.js";

export const registerMonitorRoutes = (
  app: FastifyInstance,
  monitorRepository: MonitorRepository,
  checkHistoryRepository: CheckHistoryRepository,
  incidentRepository: IncidentRepository,
  alertRepository: AlertRepository,
  healthCheckOptions: HealthCheckOptions = {},
): void => {
  app.post("/monitors", async (request, reply) => {
    const validation = validateCreateMonitorBody(request.body);

    if (!validation.success) {
      return reply.status(400).send({ error: validation.error });
    }

    const monitor = await monitorRepository.create(validation.data);

    return reply.status(201).send(monitor);
  });

  app.get("/monitors", async () => {
    return {
      monitors: await monitorRepository.findAll(),
    };
  });

  app.get("/alerts", async () => {
    return {
      alerts: await alertRepository.listAll(),
    };
  });

  app.get<{ Params: { id: string } }>(
    "/monitors/:id/check",
    async (request, reply) => {
      const monitor = await monitorRepository.findById(request.params.id);

      if (!monitor) {
        return reply.status(404).send({ error: "Monitor not found" });
      }

      const result = await runMonitorCheck(
        monitor,
        checkHistoryRepository,
        incidentRepository,
        alertRepository,
        healthCheckOptions,
      );

      return reply.status(200).send(result);
    },
  );

  app.get<{ Params: { id: string } }>(
    "/monitors/:id/checks",
    async (request, reply) => {
      const monitor = await monitorRepository.findById(request.params.id);

      if (!monitor) {
        return reply.status(404).send({ error: "Monitor not found" });
      }

      return {
        checks: await checkHistoryRepository.findByMonitorId(monitor.id),
      };
    },
  );

  app.get<{ Params: { id: string } }>(
    "/monitors/:id/stats",
    async (request, reply) => {
      const monitor = await monitorRepository.findById(request.params.id);

      if (!monitor) {
        return reply.status(404).send({ error: "Monitor not found" });
      }

      const checks = await checkHistoryRepository.findByMonitorId(monitor.id);

      return calculateMonitorStats(monitor.id, checks);
    },
  );

  app.get<{ Params: { id: string }; Querystring: { period?: string } }>(
    "/monitors/:id/uptime",
    async (request, reply) => {
      const monitor = await monitorRepository.findById(request.params.id);

      if (!monitor) {
        return reply.status(404).send({ error: "Monitor not found" });
      }

      const period = parseUptimePeriod(request.query.period);

      if (!period) {
        return reply.status(400).send({ error: "Invalid period" });
      }

      const uptime = await getMonitorUptime(
        monitor.id,
        period,
        checkHistoryRepository.getUptimeStats.bind(checkHistoryRepository),
      );

      return reply.status(200).send(uptime);
    },
  );

  app.get<{ Params: { id: string }; Querystring: { period?: string } }>(
    "/monitors/:id/sla",
    async (request, reply) => {
      const monitor = await monitorRepository.findById(request.params.id);

      if (!monitor) {
        return reply.status(404).send({ error: "Monitor not found" });
      }

      const period = parseUptimePeriod(request.query.period);

      if (!period) {
        return reply.status(400).send({ error: "Invalid period" });
      }

      const sla = await getMonitorSla(
        monitor.id,
        period,
        checkHistoryRepository.getUptimeStats.bind(checkHistoryRepository),
      );

      return reply.status(200).send(sla);
    },
  );

  app.get<{ Params: { id: string } }>(
    "/monitors/:id/incidents",
    async (request, reply) => {
      const monitor = await monitorRepository.findById(request.params.id);

      if (!monitor) {
        return reply.status(404).send({ error: "Monitor not found" });
      }

      return {
        incidents: await incidentRepository.findByMonitorId(monitor.id),
      };
    },
  );

  app.get<{ Params: { id: string } }>(
    "/monitors/:id/alerts",
    async (request, reply) => {
      const monitor = await monitorRepository.findById(request.params.id);

      if (!monitor) {
        return reply.status(404).send({ error: "Monitor not found" });
      }

      return {
        alerts: await alertRepository.findByMonitorId(monitor.id),
      };
    },
  );

  app.get<{ Params: { id: string } }>(
    "/monitors/:id",
    async (request, reply) => {
      const monitor = await monitorRepository.findById(request.params.id);

      if (!monitor) {
        return reply.status(404).send({ error: "Monitor not found" });
      }

      return monitor;
    },
  );
};
