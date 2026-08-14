export type AlertType = "incident_opened" | "incident_resolved";

export type AlertEvent = {
  id: string;
  monitorId: string;
  incidentId: string;
  type: AlertType;
  createdAt: string;
  message: string;
};

export type DashboardOverview = {
  totalMonitors: number;
  upMonitors: number;
  downMonitors: number;
  openIncidents: number;
  resolvedIncidents: number;
  totalAlerts: number;
  recentAlerts: AlertEvent[];
  overallUptimePercentage: number;
  averageResponseTimeMs: number;
  period: "24h";
  from: string;
  to: string;
};

export type MonitorStatus = "up" | "down" | "unknown";

export type Monitor = {
  id: string;
  name: string;
  url: string;
};

export type CheckResult = {
  id: string;
  monitorId: string;
  status: "up" | "down";
  responseTimeMs: number;
  checkedAt: string;
  statusCode?: number;
  error?: string;
};

export type Incident = {
  id: string;
  monitorId: string;
  status: "open" | "resolved";
  startedAt: string;
  resolvedAt?: string;
  durationMs?: number;
  reason: string;
};

export type MonitorWithStatus = Monitor & {
  status: MonitorStatus;
  hasOpenIncident: boolean;
  lastCheckedAt?: string;
  responseTimeMs?: number;
  openIncident?: {
    id: string;
    startedAt: string;
  };
};

export type DashboardData = {
  overview: DashboardOverview;
  monitors: MonitorWithStatus[];
};

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}
