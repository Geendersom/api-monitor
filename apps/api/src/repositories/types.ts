import type { AlertEvent, AlertType } from "../monitors/alerts.js";
import type { CheckResult } from "../monitors/history.js";
import type { UptimeStatsAggregate } from "../monitors/uptime.js";
import type { MaintenanceWindow } from "../monitors/maintenance.js";
import type { Incident } from "../monitors/incidents.js";
import type { CreateMonitorInput, Monitor } from "../monitors/types.js";

export type MonitorLatestStatus = {
  monitorId: string;
  status: "up" | "down";
};

export type IncidentStatusCounts = {
  open: number;
  resolved: number;
};

export interface MonitorRepository {
  create(input: CreateMonitorInput): Promise<Monitor>;
  findAll(): Promise<Monitor[]>;
  findById(id: string): Promise<Monitor | undefined>;
}

export interface CheckHistoryRepository {
  add(result: CheckResult): Promise<CheckResult>;
  findByMonitorId(monitorId: string): Promise<CheckResult[]>;
  listAll(): Promise<CheckResult[]>;
  getUptimeStats(
    monitorId: string,
    from: string,
    to: string,
  ): Promise<UptimeStatsAggregate>;
  getOverallUptimeStats(
    from: string,
    to: string,
  ): Promise<UptimeStatsAggregate>;
  getLatestCheckStatusByMonitor(): Promise<MonitorLatestStatus[]>;
}

export interface IncidentRepository {
  create(input: {
    monitorId: string;
    startedAt: string;
    reason?: string;
  }): Promise<Incident>;
  findOpenByMonitorId(monitorId: string): Promise<Incident | undefined>;
  resolveOpenIncident(
    monitorId: string,
    resolvedAt: string,
  ): Promise<Incident | undefined>;
  findByMonitorId(monitorId: string): Promise<Incident[]>;
  countByStatus(): Promise<IncidentStatusCounts>;
}

export interface AlertRepository {
  add(input: {
    monitorId: string;
    incidentId: string;
    type: AlertType;
    createdAt: string;
    message?: string;
  }): Promise<AlertEvent>;
  listAll(): Promise<AlertEvent[]>;
  findByMonitorId(monitorId: string): Promise<AlertEvent[]>;
  findByIncidentId(incidentId: string): Promise<AlertEvent[]>;
  countAll(): Promise<number>;
  findRecent(limit: number): Promise<AlertEvent[]>;
}

export interface MaintenanceRepository {
  create(input: {
    monitorId: string;
    title: string;
    reason?: string;
    startsAt: string;
    endsAt: string;
  }): Promise<MaintenanceWindow>;
  findByMonitorId(monitorId: string): Promise<MaintenanceWindow[]>;
  findById(
    monitorId: string,
    maintenanceId: string,
  ): Promise<MaintenanceWindow | undefined>;
  findActiveAt(
    monitorId: string,
    at: string,
  ): Promise<MaintenanceWindow | undefined>;
  hasOverlappingWindow(
    monitorId: string,
    startsAt: string,
    endsAt: string,
    excludeId?: string,
  ): Promise<boolean>;
  delete(monitorId: string, maintenanceId: string): Promise<boolean>;
}

export type Repositories = {
  monitorRepository: MonitorRepository;
  checkHistoryRepository: CheckHistoryRepository;
  incidentRepository: IncidentRepository;
  alertRepository: AlertRepository;
  maintenanceRepository: MaintenanceRepository;
};
