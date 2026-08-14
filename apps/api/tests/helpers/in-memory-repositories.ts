import { AlertStore } from "../../src/monitors/alerts.js";
import { CheckHistoryStore } from "../../src/monitors/history.js";
import { IncidentStore } from "../../src/monitors/incidents.js";
import { MaintenanceStore } from "../../src/monitors/maintenance-store.js";
import { MonitorStore } from "../../src/monitors/store.js";
import type { Repositories } from "../../src/repositories/types.js";

export const createInMemoryRepositories = (): Repositories => ({
  monitorRepository: new MonitorStore(),
  checkHistoryRepository: new CheckHistoryStore(),
  incidentRepository: new IncidentStore(),
  alertRepository: new AlertStore(),
  maintenanceRepository: new MaintenanceStore(),
});
