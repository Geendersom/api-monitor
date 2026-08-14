import { randomUUID } from "node:crypto";

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

export class AlertStore {
  private readonly alerts: AlertEvent[] = [];

  add(input: {
    monitorId: string;
    incidentId: string;
    type: AlertType;
    createdAt: string;
    message?: string;
  }): AlertEvent {
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

  listAll(): AlertEvent[] {
    return [...this.alerts];
  }

  findByMonitorId(monitorId: string): AlertEvent[] {
    return this.alerts.filter((alert) => alert.monitorId === monitorId);
  }

  findByIncidentId(incidentId: string): AlertEvent[] {
    return this.alerts.filter((alert) => alert.incidentId === incidentId);
  }
}

export const processIncidentAlerts = (
  result: IncidentProcessingResult,
  alertStore: AlertStore,
  createdAt: string,
): void => {
  if (result.openedIncident) {
    alertStore.add({
      monitorId: result.openedIncident.monitorId,
      incidentId: result.openedIncident.id,
      type: "incident_opened",
      createdAt,
    });
  }

  if (result.resolvedIncident) {
    alertStore.add({
      monitorId: result.resolvedIncident.monitorId,
      incidentId: result.resolvedIncident.id,
      type: "incident_resolved",
      createdAt,
    });
  }
};
