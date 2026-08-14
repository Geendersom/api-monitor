import { randomUUID } from "node:crypto";

import type { Pool } from "pg";

import type { MaintenanceWindow } from "../../monitors/maintenance.js";
import type { MaintenanceRepository } from "../types.js";

type MaintenanceRow = {
  id: string;
  monitor_id: string;
  title: string;
  reason: string | null;
  starts_at: Date;
  ends_at: Date;
  created_at: Date;
};

const mapMaintenanceRow = (row: MaintenanceRow): MaintenanceWindow => {
  const window: MaintenanceWindow = {
    id: row.id,
    monitorId: row.monitor_id,
    title: row.title,
    startsAt: row.starts_at.toISOString(),
    endsAt: row.ends_at.toISOString(),
    createdAt: row.created_at.toISOString(),
  };

  if (row.reason !== null) {
    window.reason = row.reason;
  }

  return window;
};

export class PostgresMaintenanceRepository implements MaintenanceRepository {
  constructor(private readonly pool: Pool) {}

  async create(input: {
    monitorId: string;
    title: string;
    reason?: string;
    startsAt: string;
    endsAt: string;
  }): Promise<MaintenanceWindow> {
    const window: MaintenanceWindow = {
      id: randomUUID(),
      monitorId: input.monitorId,
      title: input.title,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      createdAt: new Date().toISOString(),
    };

    if (input.reason !== undefined) {
      window.reason = input.reason;
    }

    await this.pool.query(
      `
        INSERT INTO maintenance_windows (
          id,
          monitor_id,
          title,
          reason,
          starts_at,
          ends_at,
          created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `,
      [
        window.id,
        window.monitorId,
        window.title,
        window.reason ?? null,
        window.startsAt,
        window.endsAt,
        window.createdAt,
      ],
    );

    return window;
  }

  async findByMonitorId(monitorId: string): Promise<MaintenanceWindow[]> {
    const result = await this.pool.query<MaintenanceRow>(
      `
        SELECT
          id,
          monitor_id,
          title,
          reason,
          starts_at,
          ends_at,
          created_at
        FROM maintenance_windows
        WHERE monitor_id = $1
        ORDER BY starts_at ASC
      `,
      [monitorId],
    );

    return result.rows.map(mapMaintenanceRow);
  }

  async findById(
    monitorId: string,
    maintenanceId: string,
  ): Promise<MaintenanceWindow | undefined> {
    const result = await this.pool.query<MaintenanceRow>(
      `
        SELECT
          id,
          monitor_id,
          title,
          reason,
          starts_at,
          ends_at,
          created_at
        FROM maintenance_windows
        WHERE monitor_id = $1 AND id = $2
      `,
      [monitorId, maintenanceId],
    );

    const row = result.rows[0];

    return row ? mapMaintenanceRow(row) : undefined;
  }

  async findActiveAt(
    monitorId: string,
    at: string,
  ): Promise<MaintenanceWindow | undefined> {
    const result = await this.pool.query<MaintenanceRow>(
      `
        SELECT
          id,
          monitor_id,
          title,
          reason,
          starts_at,
          ends_at,
          created_at
        FROM maintenance_windows
        WHERE monitor_id = $1
          AND starts_at <= $2
          AND ends_at >= $2
        ORDER BY starts_at ASC
        LIMIT 1
      `,
      [monitorId, at],
    );

    const row = result.rows[0];

    return row ? mapMaintenanceRow(row) : undefined;
  }

  async hasOverlappingWindow(
    monitorId: string,
    startsAt: string,
    endsAt: string,
    excludeId?: string,
  ): Promise<boolean> {
    const result = await this.pool.query<{ exists: boolean }>(
      `
        SELECT EXISTS(
          SELECT 1
          FROM maintenance_windows
          WHERE monitor_id = $1
            AND starts_at < $3
            AND ends_at > $2
            AND ($4::UUID IS NULL OR id <> $4)
        ) AS exists
      `,
      [monitorId, startsAt, endsAt, excludeId ?? null],
    );

    return result.rows[0]?.exists ?? false;
  }

  async delete(monitorId: string, maintenanceId: string): Promise<boolean> {
    const result = await this.pool.query(
      `
        DELETE FROM maintenance_windows
        WHERE monitor_id = $1 AND id = $2
      `,
      [monitorId, maintenanceId],
    );

    return (result.rowCount ?? 0) > 0;
  }
}
