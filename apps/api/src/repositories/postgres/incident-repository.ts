import { randomUUID } from "node:crypto";

import type { Pool } from "pg";

import {
  DEFAULT_INCIDENT_REASON,
  type Incident,
} from "../../monitors/incidents.js";
import type { IncidentRepository } from "../types.js";

type IncidentRow = {
  id: string;
  monitor_id: string;
  status: "open" | "resolved";
  started_at: Date;
  resolved_at: Date | null;
  duration_ms: number | null;
  reason: string;
};

const mapIncidentRow = (row: IncidentRow): Incident => {
  const incident: Incident = {
    id: row.id,
    monitorId: row.monitor_id,
    status: row.status,
    startedAt: row.started_at.toISOString(),
    reason: row.reason,
  };

  if (row.resolved_at !== null) {
    incident.resolvedAt = row.resolved_at.toISOString();
  }

  if (row.duration_ms !== null) {
    incident.durationMs = row.duration_ms;
  }

  return incident;
};

export class PostgresIncidentRepository implements IncidentRepository {
  constructor(private readonly pool: Pool) {}

  async create(input: {
    monitorId: string;
    startedAt: string;
    reason?: string;
  }): Promise<Incident> {
    const incident: Incident = {
      id: randomUUID(),
      monitorId: input.monitorId,
      status: "open",
      startedAt: input.startedAt,
      reason: input.reason ?? DEFAULT_INCIDENT_REASON,
    };

    await this.pool.query(
      `
        INSERT INTO incidents (
          id,
          monitor_id,
          status,
          started_at,
          reason
        )
        VALUES ($1, $2, $3, $4, $5)
      `,
      [
        incident.id,
        incident.monitorId,
        incident.status,
        incident.startedAt,
        incident.reason,
      ],
    );

    return incident;
  }

  async findOpenByMonitorId(monitorId: string): Promise<Incident | undefined> {
    const result = await this.pool.query<IncidentRow>(
      `
        SELECT
          id,
          monitor_id,
          status,
          started_at,
          resolved_at,
          duration_ms,
          reason
        FROM incidents
        WHERE monitor_id = $1 AND status = 'open'
        ORDER BY started_at ASC
        LIMIT 1
      `,
      [monitorId],
    );

    const row = result.rows[0];

    return row ? mapIncidentRow(row) : undefined;
  }

  async resolveOpenIncident(
    monitorId: string,
    resolvedAt: string,
  ): Promise<Incident | undefined> {
    const result = await this.pool.query<IncidentRow>(
      `
        UPDATE incidents
        SET
          status = 'resolved',
          resolved_at = $2,
          duration_ms = (
            EXTRACT(EPOCH FROM ($2::timestamptz - started_at)) * 1000
          )::INTEGER
        WHERE monitor_id = $1 AND status = 'open'
        RETURNING
          id,
          monitor_id,
          status,
          started_at,
          resolved_at,
          duration_ms,
          reason
      `,
      [monitorId, resolvedAt],
    );

    const row = result.rows[0];

    return row ? mapIncidentRow(row) : undefined;
  }

  async findByMonitorId(monitorId: string): Promise<Incident[]> {
    const result = await this.pool.query<IncidentRow>(
      `
        SELECT
          id,
          monitor_id,
          status,
          started_at,
          resolved_at,
          duration_ms,
          reason
        FROM incidents
        WHERE monitor_id = $1
        ORDER BY started_at ASC
      `,
      [monitorId],
    );

    return result.rows.map(mapIncidentRow);
  }
}
