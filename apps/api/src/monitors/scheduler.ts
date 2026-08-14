import type { HealthCheckOptions } from "./check.js";
import type {
  AlertRepository,
  CheckHistoryRepository,
  IncidentRepository,
  MaintenanceRepository,
  MonitorRepository,
} from "../repositories/types.js";
import { runMonitorCheck } from "./run-check.js";

export const DEFAULT_SCHEDULER_INTERVAL_MS = 30_000;

export type MonitorSchedulerOptions = {
  monitorRepository: MonitorRepository;
  checkHistoryRepository: CheckHistoryRepository;
  incidentRepository: IncidentRepository;
  alertRepository: AlertRepository;
  maintenanceRepository: MaintenanceRepository;
  healthCheckOptions?: HealthCheckOptions;
  intervalMs?: number;
};

export class MonitorScheduler {
  private readonly monitorRepository: MonitorRepository;
  private readonly checkHistoryRepository: CheckHistoryRepository;
  private readonly incidentRepository: IncidentRepository;
  private readonly alertRepository: AlertRepository;
  private readonly maintenanceRepository: MaintenanceRepository;
  private readonly healthCheckOptions: HealthCheckOptions;
  private readonly intervalMs: number;
  private timer: ReturnType<typeof setInterval> | null = null;
  private cycleInProgress = false;
  private started = false;

  constructor(options: MonitorSchedulerOptions) {
    this.monitorRepository = options.monitorRepository;
    this.checkHistoryRepository = options.checkHistoryRepository;
    this.incidentRepository = options.incidentRepository;
    this.alertRepository = options.alertRepository;
    this.maintenanceRepository = options.maintenanceRepository;
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
      const monitors = await this.monitorRepository.findAll();

      for (const monitor of monitors) {
        try {
          await runMonitorCheck(
            monitor,
            this.checkHistoryRepository,
            this.incidentRepository,
            this.alertRepository,
            this.maintenanceRepository,
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
