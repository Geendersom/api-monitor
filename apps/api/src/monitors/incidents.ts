import { randomUUID } from "node:crypto";

import type { IncidentRepository } from "../repositories/types.js";
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

export type ProcessMonitorResultOptions = {
  inMaintenance?: boolean;
};

export const DEFAULT_INCIDENT_REASON = "Health check failed";

export class IncidentStore implements IncidentRepository {
  private readonly incidentsByMonitorId = new Map<string, Incident[]>();

  async create(input: {
    monitorId: string;
    startedAt: string;
    reason?: string;
  }): Promise<Incident> {
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

  async findOpenByMonitorId(monitorId: string): Promise<Incident | undefined> {
    const incidents = this.incidentsByMonitorId.get(monitorId) ?? [];

    return incidents.find((incident) => incident.status === "open");
  }

  async resolveOpenIncident(
    monitorId: string,
    resolvedAt: string,
  ): Promise<Incident | undefined> {
    const incident = await this.findOpenByMonitorId(monitorId);

    if (!incident) {
      return undefined;
    }

    incident.status = "resolved";
    incident.resolvedAt = resolvedAt;
    incident.durationMs =
      new Date(resolvedAt).getTime() - new Date(incident.startedAt).getTime();

    return incident;
  }

  async findByMonitorId(monitorId: string): Promise<Incident[]> {
    return [...(this.incidentsByMonitorId.get(monitorId) ?? [])];
  }
}

export const processMonitorResult = async (
  checkResult: CheckResult,
  incidentRepository: IncidentRepository,
  options: ProcessMonitorResultOptions = {},
): Promise<IncidentProcessingResult> => {
  if (options.inMaintenance) {
    return {};
  }

  if (checkResult.status === "down") {
    if (
      !(await incidentRepository.findOpenByMonitorId(checkResult.monitorId))
    ) {
      return {
        openedIncident: await incidentRepository.create({
          monitorId: checkResult.monitorId,
          startedAt: checkResult.checkedAt,
        }),
      };
    }

    return {};
  }

  const resolvedIncident = await incidentRepository.resolveOpenIncident(
    checkResult.monitorId,
    checkResult.checkedAt,
  );

  if (resolvedIncident) {
    return { resolvedIncident };
  }

  return {};
};
