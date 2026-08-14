import { randomUUID } from "node:crypto";

import type { CheckResult } from "./history.js";

export type Incident = {
  id: string;
  monitorId: string;
  status: "open" | "resolved";
  startedAt: string;
  resolvedAt?: string;
  durationMs?: number;
  reason: string;
};

export type IncidentProcessingResult = {
  openedIncident?: Incident;
  resolvedIncident?: Incident;
};

export const DEFAULT_INCIDENT_REASON = "Health check failed";

export class IncidentStore {
  private readonly incidentsByMonitorId = new Map<string, Incident[]>();

  create(input: {
    monitorId: string;
    startedAt: string;
    reason?: string;
  }): Incident {
    const incident: Incident = {
      id: randomUUID(),
      monitorId: input.monitorId,
      status: "open",
      startedAt: input.startedAt,
      reason: input.reason ?? DEFAULT_INCIDENT_REASON,
    };

    const incidents = this.incidentsByMonitorId.get(input.monitorId) ?? [];

    incidents.push(incident);
    this.incidentsByMonitorId.set(input.monitorId, incidents);

    return incident;
  }

  findOpenByMonitorId(monitorId: string): Incident | undefined {
    const incidents = this.incidentsByMonitorId.get(monitorId) ?? [];

    return incidents.find((incident) => incident.status === "open");
  }

  resolveOpenIncident(
    monitorId: string,
    resolvedAt: string,
  ): Incident | undefined {
    const incident = this.findOpenByMonitorId(monitorId);

    if (!incident) {
      return undefined;
    }

    incident.status = "resolved";
    incident.resolvedAt = resolvedAt;
    incident.durationMs =
      new Date(resolvedAt).getTime() - new Date(incident.startedAt).getTime();

    return incident;
  }

  findByMonitorId(monitorId: string): Incident[] {
    return [...(this.incidentsByMonitorId.get(monitorId) ?? [])];
  }
}

export const processMonitorResult = (
  checkResult: CheckResult,
  incidentStore: IncidentStore,
): IncidentProcessingResult => {
  if (checkResult.status === "down") {
    if (!incidentStore.findOpenByMonitorId(checkResult.monitorId)) {
      return {
        openedIncident: incidentStore.create({
          monitorId: checkResult.monitorId,
          startedAt: checkResult.checkedAt,
        }),
      };
    }

    return {};
  }

  const resolvedIncident = incidentStore.resolveOpenIncident(
    checkResult.monitorId,
    checkResult.checkedAt,
  );

  if (resolvedIncident) {
    return { resolvedIncident };
  }

  return {};
};
