import type { AlertEvent, AlertType } from "../monitors/alerts.js";
import type { CheckResult } from "../monitors/history.js";
import type { Incident } from "../monitors/incidents.js";
import type { CreateMonitorInput, Monitor } from "../monitors/types.js";

export interface MonitorRepository {
  create(input: CreateMonitorInput): Promise<Monitor>;
  findAll(): Promise<Monitor[]>;
  findById(id: string): Promise<Monitor | undefined>;
}

export interface CheckHistoryRepository {
  add(result: CheckResult): Promise<CheckResult>;
  findByMonitorId(monitorId: string): Promise<CheckResult[]>;
  listAll(): Promise<CheckResult[]>;
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
}

export type Repositories = {
  monitorRepository: MonitorRepository;
  checkHistoryRepository: CheckHistoryRepository;
  incidentRepository: IncidentRepository;
  alertRepository: AlertRepository;
};
