import { randomUUID } from "node:crypto";

import type { AlertRepository } from "../repositories/types.js";
import type { IncidentProcessingResult } from "./incidents.js";

export type AlertType = "incident_opened" | "incident_resolved";

export type AlertEvent = {
  id: string;
  monitorId: string;
  incidentId: string;
  type: AlertType;
  createdAt: string;
  message: string;
};

const ALERT_MESSAGES: Record<AlertType, string> = {
  incident_opened: "Monitor incident opened",
  incident_resolved: "Monitor incident resolved",
};

export class AlertStore implements AlertRepository {
  private readonly alerts: AlertEvent[] = [];

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

    this.alerts.push(alert);

    return alert;
  }

  async listAll(): Promise<AlertEvent[]> {
    return [...this.alerts];
  }

  async findByMonitorId(monitorId: string): Promise<AlertEvent[]> {
    return this.alerts.filter((alert) => alert.monitorId === monitorId);
  }

  async findByIncidentId(incidentId: string): Promise<AlertEvent[]> {
    return this.alerts.filter((alert) => alert.incidentId === incidentId);
  }

  async countAll(): Promise<number> {
    return this.alerts.length;
  }

  async findRecent(limit: number): Promise<AlertEvent[]> {
    return [...this.alerts]
      .sort(
        (left, right) =>
          new Date(right.createdAt).getTime() -
          new Date(left.createdAt).getTime(),
      )
      .slice(0, limit);
  }
}

export const processIncidentAlerts = async (
  result: IncidentProcessingResult,
  alertRepository: AlertRepository,
  createdAt: string,
): Promise<void> => {
  if (result.openedIncident) {
    await alertRepository.add({
      monitorId: result.openedIncident.monitorId,
      incidentId: result.openedIncident.id,
      type: "incident_opened",
      createdAt,
    });
  }

  if (result.resolvedIncident) {
    await alertRepository.add({
      monitorId: result.resolvedIncident.monitorId,
      incidentId: result.resolvedIncident.id,
      type: "incident_resolved",
      createdAt,
    });
  }
};
