import type { FastifyInstance } from "fastify";

import { getDashboardOverview } from "./overview.js";
import type { Repositories } from "../repositories/types.js";

export const registerDashboardRoutes = (
  app: FastifyInstance,
  repositories: Repositories,
): void => {
  app.get("/dashboard/overview", async () => {
    return getDashboardOverview(repositories);
  });
};
