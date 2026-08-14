import { randomUUID } from "node:crypto";

import type { HealthCheckResult } from "./check.js";

export type CheckResult = {
  id: string;
  monitorId: string;
  status: "up" | "down";
  responseTimeMs: number;
  checkedAt: string;
  statusCode?: number;
  error?: string;
};

export const createCheckResult = (
  monitorId: string,
  result: HealthCheckResult,
): CheckResult => {
  const record: CheckResult = {
    id: randomUUID(),
    monitorId,
    status: result.status,
    responseTimeMs: result.responseTimeMs,
    checkedAt: new Date().toISOString(),
  };

  if ("statusCode" in result) {
    record.statusCode = result.statusCode;
  }

  if ("error" in result) {
    record.error = result.error;
  }

  return record;
};

export class CheckHistoryStore {
  private readonly checksByMonitorId = new Map<string, CheckResult[]>();

  add(result: CheckResult): CheckResult {
    const monitorChecks = this.checksByMonitorId.get(result.monitorId) ?? [];

    monitorChecks.push(result);
    this.checksByMonitorId.set(result.monitorId, monitorChecks);

    return result;
  }

  findByMonitorId(monitorId: string): CheckResult[] {
    return this.checksByMonitorId.get(monitorId) ?? [];
  }

  listAll(): CheckResult[] {
    return Array.from(this.checksByMonitorId.values()).flat();
  }
}
