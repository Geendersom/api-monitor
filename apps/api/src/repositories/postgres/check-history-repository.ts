import type { Pool } from "pg";

import type { CheckResult } from "../../monitors/history.js";
import type { CheckHistoryRepository } from "../types.js";

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
}
