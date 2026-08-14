import { randomUUID } from "node:crypto";

import type { CheckHistoryRepository } from "../repositories/types.js";
import type { UptimeStatsAggregate } from "./uptime.js";
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

  async getUptimeStats(
    monitorId: string,
    from: string,
    to: string,
  ): Promise<UptimeStatsAggregate> {
    const checks = (this.checksByMonitorId.get(monitorId) ?? []).filter(
      (check) => check.checkedAt >= from && check.checkedAt <= to,
    );

    if (checks.length === 0) {
      return {
        totalChecks: 0,
        successfulChecks: 0,
        failedChecks: 0,
        averageResponseTimeMs: 0,
      };
    }

    const successfulChecks = checks.filter(
      (check) => check.status === "up",
    ).length;
    const failedChecks = checks.filter(
      (check) => check.status === "down",
    ).length;
    const totalResponseTimeMs = checks.reduce(
      (sum, check) => sum + check.responseTimeMs,
      0,
    );

    return {
      totalChecks: checks.length,
      successfulChecks,
      failedChecks,
      averageResponseTimeMs: totalResponseTimeMs / checks.length,
    };
  }
}
