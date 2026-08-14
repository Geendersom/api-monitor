import { randomUUID } from "node:crypto";

import type { Pool } from "pg";

import type { CreateMonitorInput, Monitor } from "../../monitors/types.js";
import type { MonitorRepository } from "../types.js";

type MonitorRow = {
  id: string;
  name: string;
  url: string;
};

const mapMonitorRow = (row: MonitorRow): Monitor => ({
  id: row.id,
  name: row.name,
  url: row.url,
});

export class PostgresMonitorRepository implements MonitorRepository {
  constructor(private readonly pool: Pool) {}

  async create(input: CreateMonitorInput): Promise<Monitor> {
    const monitor: Monitor = {
      id: randomUUID(),
      name: input.name,
      url: input.url,
    };

    await this.pool.query(
      "INSERT INTO monitors (id, name, url) VALUES ($1, $2, $3)",
      [monitor.id, monitor.name, monitor.url],
    );

    return monitor;
  }

  async findAll(): Promise<Monitor[]> {
    const result = await this.pool.query<MonitorRow>(
      "SELECT id, name, url FROM monitors ORDER BY created_at ASC",
    );

    return result.rows.map(mapMonitorRow);
  }

  async findById(id: string): Promise<Monitor | undefined> {
    const result = await this.pool.query<MonitorRow>(
      "SELECT id, name, url FROM monitors WHERE id = $1",
      [id],
    );

    const row = result.rows[0];

    return row ? mapMonitorRow(row) : undefined;
  }
}
