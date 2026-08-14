import { randomUUID } from "node:crypto";

import type { Pool } from "pg";

import type { AlertEvent, AlertType } from "../../monitors/alerts.js";
import type { AlertRepository } from "../types.js";

const ALERT_MESSAGES: Record<AlertType, string> = {
  incident_opened: "Monitor incident opened",
  incident_resolved: "Monitor incident resolved",
};

type AlertEventRow = {
  id: string;
  monitor_id: string;
  incident_id: string;
  type: AlertType;
  created_at: Date;
  message: string;
};

const mapAlertEventRow = (row: AlertEventRow): AlertEvent => ({
  id: row.id,
  monitorId: row.monitor_id,
  incidentId: row.incident_id,
  type: row.type,
  createdAt: row.created_at.toISOString(),
  message: row.message,
});

export class PostgresAlertRepository implements AlertRepository {
  constructor(private readonly pool: Pool) {}

  async add(input: {
    monitorId: string;
    incidentId: string;
    type: AlertType;
    createdAt: string;
    message?: string;
  }): Promise<AlertEvent> {
    const alert: AlertEvent = {
      id: randomUUID(),
      monitorId: input.monitorId,
      incidentId: input.incidentId,
      type: input.type,
      createdAt: input.createdAt,
      message: input.message ?? ALERT_MESSAGES[input.type],
    };

    await this.pool.query(
      `
        INSERT INTO alert_events (
          id,
          monitor_id,
          incident_id,
          type,
          created_at,
          message
        )
        VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [
        alert.id,
        alert.monitorId,
        alert.incidentId,
        alert.type,
        alert.createdAt,
        alert.message,
      ],
    );

    return alert;
  }

  async listAll(): Promise<AlertEvent[]> {
    const result = await this.pool.query<AlertEventRow>(
      `
        SELECT
          id,
          monitor_id,
          incident_id,
          type,
          created_at,
          message
        FROM alert_events
        ORDER BY created_at ASC
      `,
    );

    return result.rows.map(mapAlertEventRow);
  }

  async findByMonitorId(monitorId: string): Promise<AlertEvent[]> {
    const result = await this.pool.query<AlertEventRow>(
      `
        SELECT
          id,
          monitor_id,
          incident_id,
          type,
          created_at,
          message
        FROM alert_events
        WHERE monitor_id = $1
        ORDER BY created_at ASC
      `,
      [monitorId],
    );

    return result.rows.map(mapAlertEventRow);
  }

  async findByIncidentId(incidentId: string): Promise<AlertEvent[]> {
    const result = await this.pool.query<AlertEventRow>(
      `
        SELECT
          id,
          monitor_id,
          incident_id,
          type,
          created_at,
          message
        FROM alert_events
        WHERE incident_id = $1
        ORDER BY created_at ASC
      `,
      [incidentId],
    );

    return result.rows.map(mapAlertEventRow);
  }

  async countAll(): Promise<number> {
    const result = await this.pool.query<{ count: string }>(
      "SELECT COUNT(*)::TEXT AS count FROM alert_events",
    );

    return Number(result.rows[0]?.count ?? 0);
  }

  async findRecent(limit: number): Promise<AlertEvent[]> {
    const result = await this.pool.query<AlertEventRow>(
      `
        SELECT
          id,
          monitor_id,
          incident_id,
          type,
          created_at,
          message
        FROM alert_events
        ORDER BY created_at DESC
        LIMIT $1
      `,
      [limit],
    );

    return result.rows.map(mapAlertEventRow);
  }
}
