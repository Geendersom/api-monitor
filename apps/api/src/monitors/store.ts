import { randomUUID } from "node:crypto";

import type { CreateMonitorInput, Monitor } from "./types.js";

export class MonitorStore {
  private readonly monitors = new Map<string, Monitor>();

  create(input: CreateMonitorInput): Monitor {
    const monitor: Monitor = {
      id: randomUUID(),
      name: input.name,
      url: input.url,
    };

    this.monitors.set(monitor.id, monitor);

    return monitor;
  }

  findAll(): Monitor[] {
    return Array.from(this.monitors.values());
  }

  findById(id: string): Monitor | undefined {
    return this.monitors.get(id);
  }
}
