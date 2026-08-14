import { randomUUID } from "node:crypto";

import type { MonitorRepository } from "../repositories/types.js";
import type { CreateMonitorInput, Monitor } from "./types.js";

export class MonitorStore implements MonitorRepository {
  private readonly monitors = new Map<string, Monitor>();

  async create(input: CreateMonitorInput): Promise<Monitor> {
    const monitor: Monitor = {
      id: randomUUID(),
      name: input.name,
      url: input.url,
    };

    this.monitors.set(monitor.id, monitor);

    return monitor;
  }

  async findAll(): Promise<Monitor[]> {
    return Array.from(this.monitors.values());
  }

  async findById(id: string): Promise<Monitor | undefined> {
    return this.monitors.get(id);
  }
}
