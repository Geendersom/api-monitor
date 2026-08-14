import { apiRequest } from "./api-client.js";
import type {
  CheckResult,
  DashboardData,
  DashboardOverview,
  Incident,
  Monitor,
  MonitorWithStatus,
} from "../types/api.js";

type MonitorsResponse = {
  monitors: Monitor[];
};

type ChecksResponse = {
  checks: CheckResult[];
};

type IncidentsResponse = {
  incidents: Incident[];
};

const getOverview = (): Promise<DashboardOverview> =>
  apiRequest<DashboardOverview>("/dashboard/overview");

const getMonitors = (): Promise<MonitorsResponse> =>
  apiRequest<MonitorsResponse>("/monitors");

export const getMonitorChecks = (monitorId: string): Promise<ChecksResponse> =>
  apiRequest<ChecksResponse>(`/monitors/${monitorId}/checks`);

export const getMonitorIncidents = (
  monitorId: string,
): Promise<IncidentsResponse> =>
  apiRequest<IncidentsResponse>(`/monitors/${monitorId}/incidents`);

const buildMonitorWithStatus = async (
  monitor: Monitor,
): Promise<MonitorWithStatus> => {
  const [checksResponse, incidentsResponse] = await Promise.all([
    getMonitorChecks(monitor.id),
    getMonitorIncidents(monitor.id),
  ]);

  const lastCheck = checksResponse.checks.at(-1);
  const openIncident = incidentsResponse.incidents.find(
    (incident) => incident.status === "open",
  );
  const hasOpenIncident = openIncident !== undefined;

  const monitorWithStatus: MonitorWithStatus = {
    ...monitor,
    status: lastCheck?.status ?? "unknown",
    hasOpenIncident,
  };

  if (openIncident) {
    monitorWithStatus.openIncident = {
      id: openIncident.id,
      startedAt: openIncident.startedAt,
    };
  }

  if (lastCheck) {
    monitorWithStatus.lastCheckedAt = lastCheck.checkedAt;
    monitorWithStatus.responseTimeMs = lastCheck.responseTimeMs;
  }

  return monitorWithStatus;
};

export const fetchDashboardData = async (): Promise<DashboardData> => {
  const [overview, monitorsResponse] = await Promise.all([
    getOverview(),
    getMonitors(),
  ]);

  const monitors = await Promise.all(
    monitorsResponse.monitors.map((monitor) => buildMonitorWithStatus(monitor)),
  );

  return {
    overview,
    monitors,
  };
};

export {
  formatAlertType,
  formatDateTime,
  formatDuration,
  formatMilliseconds,
  formatPercentage,
  formatRelativeTime,
} from "./formatters.js";
