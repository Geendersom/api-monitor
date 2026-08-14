import {
  performHealthCheck,
  type HealthCheckOptions,
  type HealthCheckResult,
} from "./check.js";
import { processIncidentAlerts } from "./alerts.js";
import { createCheckResult } from "./history.js";
import { processMonitorResult } from "./incidents.js";
import type {
  AlertRepository,
  CheckHistoryRepository,
  IncidentRepository,
} from "../repositories/types.js";
import type { Monitor } from "./types.js";

export const runMonitorCheck = async (
  monitor: Monitor,
  checkHistoryRepository: CheckHistoryRepository,
  incidentRepository: IncidentRepository,
  alertRepository: AlertRepository,
  healthCheckOptions: HealthCheckOptions = {},
): Promise<HealthCheckResult> => {
  const result = await performHealthCheck(monitor.url, healthCheckOptions);

  const checkResult = await checkHistoryRepository.add(
    createCheckResult(monitor.id, result),
  );
  const incidentResult = await processMonitorResult(
    checkResult,
    incidentRepository,
  );

  await processIncidentAlerts(
    incidentResult,
    alertRepository,
    checkResult.checkedAt,
  );

  return result;
};
