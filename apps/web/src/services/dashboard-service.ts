import { USE_MOCK_DATA } from "../config/env.js";
import { getMockDashboardDataAsync } from "../mocks/index.js";
import type {
  CheckResult,
  DashboardData,
  DashboardOverview,
  Incident,
  Monitor,
  MonitorUptime,
  MonitorWithStatus,
  UptimePeriod,
  FetchResult,
} from "../types/api.js";
import { apiRequest } from "./api-client.js";
import { resolveWithMockFallback } from "./mock-fallback.js";

type MonitorsResponse = {
  monitors: Monitor[];
};

type ChecksResponse = {
  checks: CheckResult[];
};

type IncidentsResponse = {
  incidents: Incident[];
};

const DASHBOARD_UPTIME_PERIOD: UptimePeriod = "24h";

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

const getMonitorUptime = (
  monitorId: string,
  period: UptimePeriod,
): Promise<MonitorUptime> =>
  apiRequest<MonitorUptime>(`/monitors/${monitorId}/uptime?period=${period}`);

const buildMonitorWithStatus = async (
  monitor: Monitor,
): Promise<MonitorWithStatus> => {
  const [checksResponse, incidentsResponse, uptime] = await Promise.all([
    getMonitorChecks(monitor.id),
    getMonitorIncidents(monitor.id),
    getMonitorUptime(monitor.id, DASHBOARD_UPTIME_PERIOD),
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
    uptimePercentage: uptime.uptimePercentage,
  };

  if (openIncident) {
    monitorWithStatus.openIncident = {
      id: openIncident.id,
      startedAt: openIncident.startedAt,
      reason: openIncident.reason,
    };
  }

  if (lastCheck) {
    monitorWithStatus.lastCheckedAt = lastCheck.checkedAt;
    monitorWithStatus.responseTimeMs = lastCheck.responseTimeMs;
  }

  return monitorWithStatus;
};

export const fetchDashboardDataFromApi = async (): Promise<DashboardData> => {
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

export const fetchDashboardData = (): Promise<FetchResult<DashboardData>> =>
  resolveWithMockFallback(fetchDashboardDataFromApi, getMockDashboardDataAsync);

export const fetchDashboardDataLegacy = async (): Promise<DashboardData> => {
  const result = await fetchDashboardData();
  return result.data;
};

export { USE_MOCK_DATA };

export {
  formatAlertType,
  formatDateTime,
  formatDuration,
  formatMilliseconds,
  formatPercentage,
  formatRelativeTime,
} from "./formatters.js";
