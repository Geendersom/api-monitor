import { buildApiUrl } from "../config/api.js";
import type {
  AlertEvent,
  CheckResult,
  DashboardData,
  DashboardOverview,
  Incident,
  Monitor,
  MonitorWithStatus,
} from "../types/api.js";
import { ApiError } from "../types/api.js";

type MonitorsResponse = {
  monitors: Monitor[];
};

type ChecksResponse = {
  checks: CheckResult[];
};

type IncidentsResponse = {
  incidents: Incident[];
};

const parseJson = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;

    try {
      const body = (await response.json()) as { error?: string };
      if (body.error) {
        message = body.error;
      }
    } catch {
      // Ignore invalid JSON error bodies.
    }

    throw new ApiError(message, response.status);
  }

  return response.json() as Promise<T>;
};

const request = async <T>(path: string): Promise<T> => {
  let response: Response;

  try {
    response = await fetch(buildApiUrl(path));
  } catch {
    throw new ApiError(
      "Não foi possível conectar à API. Verifique se o backend está em execução.",
      0,
    );
  }

  return parseJson<T>(response);
};

const getOverview = (): Promise<DashboardOverview> =>
  request<DashboardOverview>("/dashboard/overview");

const getMonitors = (): Promise<MonitorsResponse> =>
  request<MonitorsResponse>("/monitors");

const getMonitorChecks = (monitorId: string): Promise<ChecksResponse> =>
  request<ChecksResponse>(`/monitors/${monitorId}/checks`);

const getMonitorIncidents = (monitorId: string): Promise<IncidentsResponse> =>
  request<IncidentsResponse>(`/monitors/${monitorId}/incidents`);

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

export const formatAlertType = (type: AlertEvent["type"]): string => {
  if (type === "incident_opened") {
    return "Incidente aberto";
  }

  return "Incidente resolvido";
};

export const formatDateTime = (value: string): string => {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(new Date(value));
};

export const formatPercentage = (value: number): string => {
  return `${value.toFixed(2).replace(".", ",")}%`;
};

export const formatMilliseconds = (value: number): string => {
  return `${Math.round(value)} ms`;
};

export const formatRelativeTime = (value: string): string => {
  const target = new Date(value).getTime();
  const diffMs = Date.now() - target;
  const diffSeconds = Math.max(0, Math.round(diffMs / 1000));

  if (diffSeconds < 60) {
    return `há ${diffSeconds}s`;
  }

  const diffMinutes = Math.round(diffSeconds / 60);

  if (diffMinutes < 60) {
    return `há ${diffMinutes} min`;
  }

  const diffHours = Math.round(diffMinutes / 60);

  if (diffHours < 24) {
    return `há ${diffHours} h`;
  }

  const diffDays = Math.round(diffHours / 24);
  return `há ${diffDays} d`;
};

export const formatDuration = (durationMs: number): string => {
  const totalSeconds = Math.max(0, Math.floor(durationMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }

  return `${seconds}s`;
};
