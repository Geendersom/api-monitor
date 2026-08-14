import { apiRequest } from "./api-client.js";
import type {
  AlertEvent,
  CheckResult,
  Monitor,
  MonitorDetailsData,
  MonitorSla,
  MonitorStatus,
  MonitorUptime,
  ActiveMaintenanceResponse,
  MaintenanceWindow,
  UptimePeriod,
} from "../types/api.js";
import { ApiError } from "../types/api.js";
import { getMonitorChecks, getMonitorIncidents } from "./dashboard-service.js";

type MaintenanceResponse = {
  maintenance: MaintenanceWindow[];
};

type AlertsResponse = {
  alerts: AlertEvent[];
};

export const getMonitor = (monitorId: string): Promise<Monitor> =>
  apiRequest<Monitor>(`/monitors/${monitorId}`);

export const getMonitorUptime = (
  monitorId: string,
  period: UptimePeriod,
): Promise<MonitorUptime> =>
  apiRequest<MonitorUptime>(`/monitors/${monitorId}/uptime?period=${period}`);

export const getMonitorSla = (
  monitorId: string,
  period: UptimePeriod,
): Promise<MonitorSla> =>
  apiRequest<MonitorSla>(`/monitors/${monitorId}/sla?period=${period}`);

export const getActiveMaintenance = (
  monitorId: string,
): Promise<ActiveMaintenanceResponse> =>
  apiRequest<ActiveMaintenanceResponse>(
    `/monitors/${monitorId}/maintenance/active`,
  );

export const getMaintenanceWindows = (
  monitorId: string,
): Promise<MaintenanceWindow[]> =>
  apiRequest<MaintenanceResponse>(`/monitors/${monitorId}/maintenance`).then(
    (response) => response.maintenance,
  );

export const getMonitorAlerts = (monitorId: string): Promise<AlertEvent[]> =>
  apiRequest<AlertsResponse>(`/monitors/${monitorId}/alerts`).then(
    (response) => response.alerts,
  );

const deriveStatus = (checks: CheckResult[]): MonitorStatus => {
  const lastCheck = checks.at(-1);
  return lastCheck?.status ?? "unknown";
};

export const fetchMonitorDetails = async (
  monitorId: string,
  uptimePeriod: UptimePeriod = "24h",
  slaPeriod: UptimePeriod = "24h",
): Promise<MonitorDetailsData> => {
  const monitor = await getMonitor(monitorId);

  const [
    checksResponse,
    incidentsResponse,
    uptime,
    sla,
    maintenance,
    activeMaintenance,
    alerts,
  ] = await Promise.all([
    getMonitorChecks(monitorId),
    getMonitorIncidents(monitorId),
    getMonitorUptime(monitorId, uptimePeriod),
    getMonitorSla(monitorId, slaPeriod),
    getMaintenanceWindows(monitorId),
    getActiveMaintenance(monitorId),
    getMonitorAlerts(monitorId),
  ]);

  const lastCheck = checksResponse.checks.at(-1);
  const openIncident = incidentsResponse.incidents.find(
    (incident) => incident.status === "open",
  );

  return {
    monitor,
    status: deriveStatus(checksResponse.checks),
    ...(lastCheck ? { lastCheck } : {}),
    ...(openIncident ? { openIncident } : {}),
    uptime,
    sla,
    checks: [...checksResponse.checks].reverse(),
    incidents: [...incidentsResponse.incidents].reverse(),
    maintenance,
    activeMaintenance,
    alerts: [...alerts].reverse(),
  };
};

export { ApiError };
