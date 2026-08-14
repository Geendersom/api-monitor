import Fastify, { type FastifyInstance } from "fastify";

import type { HealthCheckOptions } from "./monitors/check.js";
import { CheckHistoryStore } from "./monitors/history.js";
import { registerMonitorRoutes } from "./monitors/routes.js";
import { MonitorStore } from "./monitors/store.js";

type BuildAppOptions = {
  logger?: boolean;
  monitorStore?: MonitorStore;
  checkHistoryStore?: CheckHistoryStore;
  healthCheck?: HealthCheckOptions;
};

export const buildApp = (options: BuildAppOptions = {}): FastifyInstance => {
  const app = Fastify({
    logger: options.logger ?? false,
  });

  const monitorStore = options.monitorStore ?? new MonitorStore();
  const checkHistoryStore =
    options.checkHistoryStore ?? new CheckHistoryStore();

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
    options.healthCheck,
  );

  return app;
};
