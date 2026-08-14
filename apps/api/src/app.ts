import Fastify, { type FastifyInstance } from "fastify";

import { AlertStore } from "./monitors/alerts.js";
import type { HealthCheckOptions } from "./monitors/check.js";
import { CheckHistoryStore } from "./monitors/history.js";
import { IncidentStore } from "./monitors/incidents.js";
import { registerMonitorRoutes } from "./monitors/routes.js";
import { MonitorScheduler } from "./monitors/scheduler.js";
import { MonitorStore } from "./monitors/store.js";
import type { Repositories } from "./repositories/types.js";

type BuildAppOptions = {
  logger?: boolean;
  repositories?: Partial<Repositories>;
  monitorStore?: Repositories["monitorRepository"];
  checkHistoryStore?: Repositories["checkHistoryRepository"];
  incidentStore?: Repositories["incidentRepository"];
  alertStore?: Repositories["alertRepository"];
  healthCheck?: HealthCheckOptions;
  scheduler?: {
    intervalMs?: number;
  };
  onClose?: () => Promise<void>;
};

const resolveRepositories = (options: BuildAppOptions): Repositories => ({
  monitorRepository:
    options.repositories?.monitorRepository ??
    options.monitorStore ??
    new MonitorStore(),
  checkHistoryRepository:
    options.repositories?.checkHistoryRepository ??
    options.checkHistoryStore ??
    new CheckHistoryStore(),
  incidentRepository:
    options.repositories?.incidentRepository ??
    options.incidentStore ??
    new IncidentStore(),
  alertRepository:
    options.repositories?.alertRepository ??
    options.alertStore ??
    new AlertStore(),
});

export const buildApp = (options: BuildAppOptions = {}): FastifyInstance => {
  const app = Fastify({
    logger: options.logger ?? false,
  });

  const repositories = resolveRepositories(options);
  const healthCheckOptions = options.healthCheck ?? {};

  const monitorScheduler = new MonitorScheduler({
    monitorRepository: repositories.monitorRepository,
    checkHistoryRepository: repositories.checkHistoryRepository,
    incidentRepository: repositories.incidentRepository,
    alertRepository: repositories.alertRepository,
    healthCheckOptions,
    ...(options.scheduler?.intervalMs !== undefined
      ? { intervalMs: options.scheduler.intervalMs }
      : {}),
  });

  app.decorate("monitorScheduler", monitorScheduler);

  app.addHook("onClose", async () => {
    monitorScheduler.stop();

    if (options.onClose) {
      await options.onClose();
    }
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
    repositories.monitorRepository,
    repositories.checkHistoryRepository,
    repositories.incidentRepository,
    repositories.alertRepository,
    healthCheckOptions,
  );

  return app;
};
