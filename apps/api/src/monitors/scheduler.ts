import type { HealthCheckOptions } from "./check.js";
import type { AlertStore } from "./alerts.js";
import type { CheckHistoryStore } from "./history.js";
import type { IncidentStore } from "./incidents.js";
import { runMonitorCheck } from "./run-check.js";
import type { MonitorStore } from "./store.js";

export const DEFAULT_SCHEDULER_INTERVAL_MS = 30_000;

export type MonitorSchedulerOptions = {
  monitorStore: MonitorStore;
  checkHistoryStore: CheckHistoryStore;
  incidentStore: IncidentStore;
  alertStore: AlertStore;
  healthCheckOptions?: HealthCheckOptions;
  intervalMs?: number;
};

export class MonitorScheduler {
  private readonly monitorStore: MonitorStore;
  private readonly checkHistoryStore: CheckHistoryStore;
  private readonly incidentStore: IncidentStore;
  private readonly alertStore: AlertStore;
  private readonly healthCheckOptions: HealthCheckOptions;
  private readonly intervalMs: number;
  private timer: ReturnType<typeof setInterval> | null = null;
  private cycleInProgress = false;
  private started = false;

  constructor(options: MonitorSchedulerOptions) {
    this.monitorStore = options.monitorStore;
    this.checkHistoryStore = options.checkHistoryStore;
    this.incidentStore = options.incidentStore;
    this.alertStore = options.alertStore;
    this.healthCheckOptions = options.healthCheckOptions ?? {};
    this.intervalMs = options.intervalMs ?? DEFAULT_SCHEDULER_INTERVAL_MS;
  }

  isStarted(): boolean {
    return this.started;
  }

  isCycleInProgress(): boolean {
    return this.cycleInProgress;
  }

  start(): void {
    if (this.started) {
      return;
    }

    this.started = true;
    this.timer = setInterval(() => {
      void this.runCycle();
    }, this.intervalMs);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    this.started = false;
  }

  async runCycle(): Promise<void> {
    if (this.cycleInProgress) {
      return;
    }

    this.cycleInProgress = true;

    try {
      const monitors = this.monitorStore.findAll();

      for (const monitor of monitors) {
        try {
          await runMonitorCheck(
            monitor,
            this.checkHistoryStore,
            this.incidentStore,
            this.alertStore,
            this.healthCheckOptions,
          );
        } catch {
          // A falha de um monitor não deve interromper o ciclo inteiro.
        }
      }
    } finally {
      this.cycleInProgress = false;
    }
  }
}
