import type { Pool } from "pg";

import { PostgresAlertRepository } from "./alert-repository.js";
import { PostgresCheckHistoryRepository } from "./check-history-repository.js";
import { PostgresIncidentRepository } from "./incident-repository.js";
import { PostgresMaintenanceRepository } from "./maintenance-repository.js";
import { PostgresMonitorRepository } from "./monitor-repository.js";
import type { Repositories } from "../types.js";

export const createPostgresRepositories = (pool: Pool): Repositories => ({
  monitorRepository: new PostgresMonitorRepository(pool),
  checkHistoryRepository: new PostgresCheckHistoryRepository(pool),
  incidentRepository: new PostgresIncidentRepository(pool),
  alertRepository: new PostgresAlertRepository(pool),
  maintenanceRepository: new PostgresMaintenanceRepository(pool),
});
