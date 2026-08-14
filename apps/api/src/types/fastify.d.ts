import type { MonitorScheduler } from "./monitors/scheduler.js";

declare module "fastify" {
  interface FastifyInstance {
    monitorScheduler: MonitorScheduler;
  }
}
