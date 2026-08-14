import Fastify, { type FastifyInstance } from "fastify";

import { AlertStore } from "./monitors/alerts.js";
import type { HealthCheckOptions } from "./monitors/check.js";
import { CheckHistoryStore } from "./monitors/history.js";
import { IncidentStore } from "./monitors/incidents.js";
import { registerMonitorRoutes } from "./monitors/routes.js";
import { MonitorScheduler } from "./monitors/scheduler.js";
import { MonitorStore } from "./monitors/store.js";

type BuildAppOptions = {
  logger?: boolean;
  monitorStore?: MonitorStore;
  checkHistoryStore?: CheckHistoryStore;
  incidentStore?: IncidentStore;
  alertStore?: AlertStore;
  healthCheck?: HealthCheckOptions;
  scheduler?: {
    intervalMs?: number;
  };
};

export const buildApp = (options: BuildAppOptions = {}): FastifyInstance => {
  const app = Fastify({
    logger: options.logger ?? false,
  });

  const monitorStore = options.monitorStore ?? new MonitorStore();
  const checkHistoryStore =
    options.checkHistoryStore ?? new CheckHistoryStore();
  const incidentStore = options.incidentStore ?? new IncidentStore();
  const alertStore = options.alertStore ?? new AlertStore();
  const healthCheckOptions = options.healthCheck ?? {};

  const monitorScheduler = new MonitorScheduler({
    monitorStore,
    checkHistoryStore,
    incidentStore,
    alertStore,
    healthCheckOptions,
    ...(options.scheduler?.intervalMs !== undefined
      ? { intervalMs: options.scheduler.intervalMs }
      : {}),
  });

  app.decorate("monitorScheduler", monitorScheduler);

  app.addHook("onClose", async () => {
    monitorScheduler.stop();
  });

  app.get("/", async () => {
    return {
      name: "API Monitor",
      status: "online",
    };
  });

  app.get("/health", async () => {
    return {
      status: "ok",
    };
  });

  registerMonitorRoutes(
    app,
    monitorStore,
    checkHistoryStore,
    incidentStore,
    alertStore,
    healthCheckOptions,
  );

  return app;
};
