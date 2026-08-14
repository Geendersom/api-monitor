import type { Pool } from "pg";

import type { CheckResult } from "../../monitors/history.js";
import type { UptimeStatsAggregate } from "../../monitors/uptime.js";
import type { CheckHistoryRepository } from "../types.js";
import type { MonitorLatestStatus } from "../types.js";

type CheckResultRow = {
  id: string;
  monitor_id: string;
  status: "up" | "down";
  status_code: number | null;
  response_time_ms: number;
  checked_at: Date;
  error: string | null;
};

const mapCheckResultRow = (row: CheckResultRow): CheckResult => {
  const result: CheckResult = {
    id: row.id,
    monitorId: row.monitor_id,
    status: row.status,
    responseTimeMs: row.response_time_ms,
    checkedAt: row.checked_at.toISOString(),
  };

  if (row.status_code !== null) {
    result.statusCode = row.status_code;
  }

  if (row.error !== null) {
    result.error = row.error;
  }

  return result;
};

export class PostgresCheckHistoryRepository implements CheckHistoryRepository {
  constructor(private readonly pool: Pool) {}

  async add(result: CheckResult): Promise<CheckResult> {
    await this.pool.query(
      `
        INSERT INTO check_results (
          id,
          monitor_id,
          status,
          status_code,
          response_time_ms,
          checked_at,
          error
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `,
      [
        result.id,
        result.monitorId,
        result.status,
        result.statusCode ?? null,
        result.responseTimeMs,
        result.checkedAt,
        result.error ?? null,
      ],
    );

    return result;
  }

  async findByMonitorId(monitorId: string): Promise<CheckResult[]> {
    const result = await this.pool.query<CheckResultRow>(
      `
        SELECT
          id,
          monitor_id,
          status,
          status_code,
          response_time_ms,
          checked_at,
          error
        FROM check_results
        WHERE monitor_id = $1
        ORDER BY checked_at ASC
      `,
      [monitorId],
    );

    return result.rows.map(mapCheckResultRow);
  }

  async listAll(): Promise<CheckResult[]> {
    const result = await this.pool.query<CheckResultRow>(
      `
        SELECT
          id,
          monitor_id,
          status,
          status_code,
          response_time_ms,
          checked_at,
          error
        FROM check_results
        ORDER BY checked_at ASC
      `,
    );

    return result.rows.map(mapCheckResultRow);
  }

  async getUptimeStats(
    monitorId: string,
    from: string,
    to: string,
  ): Promise<UptimeStatsAggregate> {
    const result = await this.pool.query<{
      total_checks: string;
      successful_checks: string;
      failed_checks: string;
      average_response_time_ms: string | null;
    }>(
      `
        SELECT
          COUNT(*)::TEXT AS total_checks,
          COUNT(*) FILTER (WHERE status = 'up')::TEXT AS successful_checks,
          COUNT(*) FILTER (WHERE status = 'down')::TEXT AS failed_checks,
          AVG(response_time_ms)::TEXT AS average_response_time_ms
        FROM check_results
        WHERE monitor_id = $1
          AND checked_at >= $2
          AND checked_at <= $3
      `,
      [monitorId, from, to],
    );

    const row = result.rows[0];
    const totalChecks = Number(row?.total_checks ?? 0);

    if (totalChecks === 0) {
      return {
        totalChecks: 0,
        successfulChecks: 0,
        failedChecks: 0,
        averageResponseTimeMs: 0,
      };
    }

    return {
      totalChecks,
      successfulChecks: Number(row?.successful_checks ?? 0),
      failedChecks: Number(row?.failed_checks ?? 0),
      averageResponseTimeMs: Number(row?.average_response_time_ms ?? 0),
    };
  }

  async getOverallUptimeStats(
    from: string,
    to: string,
  ): Promise<UptimeStatsAggregate> {
    const result = await this.pool.query<{
      total_checks: string;
      successful_checks: string;
      failed_checks: string;
      average_response_time_ms: string | null;
    }>(
      `
        SELECT
          COUNT(*)::TEXT AS total_checks,
          COUNT(*) FILTER (WHERE status = 'up')::TEXT AS successful_checks,
          COUNT(*) FILTER (WHERE status = 'down')::TEXT AS failed_checks,
          AVG(response_time_ms)::TEXT AS average_response_time_ms
        FROM check_results
        WHERE checked_at >= $1
          AND checked_at <= $2
      `,
      [from, to],
    );

    const row = result.rows[0];
    const totalChecks = Number(row?.total_checks ?? 0);

    if (totalChecks === 0) {
      return {
        totalChecks: 0,
        successfulChecks: 0,
        failedChecks: 0,
        averageResponseTimeMs: 0,
      };
    }

    return {
      totalChecks,
      successfulChecks: Number(row?.successful_checks ?? 0),
      failedChecks: Number(row?.failed_checks ?? 0),
      averageResponseTimeMs: Number(row?.average_response_time_ms ?? 0),
    };
  }

  async getLatestCheckStatusByMonitor(): Promise<MonitorLatestStatus[]> {
    const result = await this.pool.query<{
      monitor_id: string;
      status: "up" | "down";
    }>(
      `
        SELECT DISTINCT ON (monitor_id)
          monitor_id,
          status
        FROM check_results
        ORDER BY monitor_id, checked_at DESC
      `,
    );

    return result.rows.map((row) => ({
      monitorId: row.monitor_id,
      status: row.status,
    }));
  }
}
