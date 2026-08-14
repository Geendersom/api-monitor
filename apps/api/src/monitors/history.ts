import { randomUUID } from "node:crypto";

import type { CheckHistoryRepository } from "../repositories/types.js";
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

export class CheckHistoryStore implements CheckHistoryRepository {
  private readonly checksByMonitorId = new Map<string, CheckResult[]>();

  async add(result: CheckResult): Promise<CheckResult> {
    const monitorChecks = this.checksByMonitorId.get(result.monitorId) ?? [];

    monitorChecks.push(result);
    this.checksByMonitorId.set(result.monitorId, monitorChecks);

    return result;
  }

  async findByMonitorId(monitorId: string): Promise<CheckResult[]> {
    return this.checksByMonitorId.get(monitorId) ?? [];
  }

  async listAll(): Promise<CheckResult[]> {
    return Array.from(this.checksByMonitorId.values()).flat();
  }
}
