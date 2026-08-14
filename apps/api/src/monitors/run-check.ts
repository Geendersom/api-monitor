import {
  performHealthCheck,
  type HealthCheckOptions,
  type HealthCheckResult,
} from "./check.js";
import { createCheckResult, type CheckHistoryStore } from "./history.js";
import type { Monitor } from "./types.js";

export const runMonitorCheck = async (
  monitor: Monitor,
  historyStore: CheckHistoryStore,
  healthCheckOptions: HealthCheckOptions = {},
): Promise<HealthCheckResult> => {
  const result = await performHealthCheck(monitor.url, healthCheckOptions);

  historyStore.add(createCheckResult(monitor.id, result));

  return result;
};
