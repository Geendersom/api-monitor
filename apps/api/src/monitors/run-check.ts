import {
  performHealthCheck,
  type HealthCheckOptions,
  type HealthCheckResult,
} from "./check.js";
import { processIncidentAlerts, type AlertStore } from "./alerts.js";
import { createCheckResult, type CheckHistoryStore } from "./history.js";
import { processMonitorResult, type IncidentStore } from "./incidents.js";
import type { Monitor } from "./types.js";

export const runMonitorCheck = async (
  monitor: Monitor,
  historyStore: CheckHistoryStore,
  incidentStore: IncidentStore,
  alertStore: AlertStore,
  healthCheckOptions: HealthCheckOptions = {},
): Promise<HealthCheckResult> => {
  const result = await performHealthCheck(monitor.url, healthCheckOptions);

  const checkResult = historyStore.add(createCheckResult(monitor.id, result));
  const incidentResult = processMonitorResult(checkResult, incidentStore);

  processIncidentAlerts(incidentResult, alertStore, checkResult.checkedAt);

  return result;
};
