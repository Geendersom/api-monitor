import Fastify, { type FastifyInstance } from "fastify";

import { MonitorStore } from "./monitors/store.js";
import { registerMonitorRoutes } from "./monitors/routes.js";

type BuildAppOptions = {
  logger?: boolean;
  monitorStore?: MonitorStore;
};

export const buildApp = (options: BuildAppOptions = {}): FastifyInstance => {
  const app = Fastify({
    logger: options.logger ?? false,
  });

  const monitorStore = options.monitorStore ?? new MonitorStore();

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

  registerMonitorRoutes(app, monitorStore);

  return app;
};
