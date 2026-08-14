import type { MaintenanceRepository } from "../repositories/types.js";
import {
  createMaintenanceWindowRecord,
  maintenanceWindowsOverlap,
  type MaintenanceWindow,
} from "./maintenance.js";

export class MaintenanceStore implements MaintenanceRepository {
  private readonly windows: MaintenanceWindow[] = [];

  async create(input: {
    monitorId: string;
    title: string;
    reason?: string;
    startsAt: string;
    endsAt: string;
  }): Promise<MaintenanceWindow> {
    const window = createMaintenanceWindowRecord(input);

    this.windows.push(window);

    return window;
  }

  async findByMonitorId(monitorId: string): Promise<MaintenanceWindow[]> {
    return this.windows
      .filter((window) => window.monitorId === monitorId)
      .sort(
        (left, right) =>
          new Date(left.startsAt).getTime() -
          new Date(right.startsAt).getTime(),
      );
  }

  async findById(
    monitorId: string,
    maintenanceId: string,
  ): Promise<MaintenanceWindow | undefined> {
    return this.windows.find(
      (window) => window.monitorId === monitorId && window.id === maintenanceId,
    );
  }

  async findActiveAt(
    monitorId: string,
    at: string,
  ): Promise<MaintenanceWindow | undefined> {
    const windows = await this.findByMonitorId(monitorId);

    return windows.find(
      (window) =>
        new Date(at).getTime() >= new Date(window.startsAt).getTime() &&
        new Date(at).getTime() <= new Date(window.endsAt).getTime(),
    );
  }

  async hasOverlappingWindow(
    monitorId: string,
    startsAt: string,
    endsAt: string,
    excludeId?: string,
  ): Promise<boolean> {
    const windows = await this.findByMonitorId(monitorId);

    return windows.some((window) => {
      if (excludeId && window.id === excludeId) {
        return false;
      }

      return maintenanceWindowsOverlap(
        startsAt,
        endsAt,
        window.startsAt,
        window.endsAt,
      );
    });
  }

  async delete(monitorId: string, maintenanceId: string): Promise<boolean> {
    const index = this.windows.findIndex(
      (window) => window.monitorId === monitorId && window.id === maintenanceId,
    );

    if (index === -1) {
      return false;
    }

    this.windows.splice(index, 1);

    return true;
  }
}
