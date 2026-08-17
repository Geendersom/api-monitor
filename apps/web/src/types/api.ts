export type AlertType = "incident_opened" | "incident_resolved";

export type AlertTone = "down" | "recovery" | "warning";

export type AlertEvent = {
  id: string;
  monitorId: string;
  incidentId: string;
  type: AlertType;
  createdAt: string;
  message: string;
  tone?: AlertTone;
};

export type DashboardOverview = {
  totalMonitors: number;
  upMonitors: number;
  downMonitors: number;
  problemMonitors?: number;
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

export type MonitorHealth = "online" | "problema" | "offline";

export type UptimeBarSegment = "up" | "down" | "warning" | "empty";

export type Monitor = {
  id: string;
  name: string;
  url: string;
};

export type CreateMonitorInput = {
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
  health?: MonitorHealth;
  hasOpenIncident: boolean;
  hasWarning?: boolean;
  paused?: boolean;
  lastCheckedAt?: string;
  responseTimeMs?: number;
  uptimePercentage?: number;
  uptimeBars7d?: UptimeBarSegment[];
  uptimeBars30d?: UptimeBarSegment[];
  openIncident?: {
    id: string;
    startedAt: string;
    reason?: string;
  };
};

export type DashboardData = {
  overview: DashboardOverview;
  monitors: MonitorWithStatus[];
};

export type UptimePeriod = "24h" | "7d" | "30d";

export const UPTIME_PERIODS: UptimePeriod[] = ["24h", "7d", "30d"];

export type MonitorUptime = {
  monitorId: string;
  period: UptimePeriod;
  from: string;
  to: string;
  totalChecks: number;
  successfulChecks: number;
  failedChecks: number;
  uptimePercentage: number;
  averageResponseTimeMs: number;
};

export type SlaStatus = "compliant" | "breached";

export type MonitorSla = {
  monitorId: string;
  period: UptimePeriod;
  from: string;
  to: string;
  slaTargetPercentage: number;
  uptimePercentage: number;
  downtimeMs: number;
  allowedDowntimeMs: number;
  exceededDowntimeMs: number;
  status: SlaStatus;
};

export type MaintenanceWindow = {
  id: string;
  monitorId: string;
  title: string;
  reason?: string;
  startsAt: string;
  endsAt: string;
  createdAt: string;
};

export type ActiveMaintenanceResponse = {
  active: boolean;
  maintenance: MaintenanceWindow | null;
};

export type MonitorDetailsData = {
  monitor: Monitor;
  status: MonitorStatus;
  lastCheck?: CheckResult;
  openIncident?: Incident;
  uptime: MonitorUptime;
  sla: MonitorSla;
  checks: CheckResult[];
  incidents: Incident[];
  maintenance: MaintenanceWindow[];
  activeMaintenance: ActiveMaintenanceResponse;
  alerts: AlertEvent[];
};

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export type IncidentWithMonitor = Incident & {
  monitorName: string;
};

export type MonitorsPageData = {
  monitors: MonitorWithStatus[];
  summary: {
    total: number;
    up: number;
    down: number;
    paused: number;
  };
};

export type IncidentsPageData = {
  active: IncidentWithMonitor[];
  resolved: IncidentWithMonitor[];
};

export type AlertsPageData = {
  alerts: AlertEvent[];
  monitorNames: Record<string, string>;
};

export type AppSettings = {
  monitoring: {
    checkIntervalSeconds: number;
    timeoutSeconds: number;
    retries: number;
  };
  notifications: {
    email: boolean;
    whatsapp: boolean;
    telegram: boolean;
    push: boolean;
  };
  system: {
    appName: string;
    environment: string;
    apiUrl: string;
  };
  security: {
    apiStatus: string;
    lastVerificationAt: string;
    systemState: string;
  };
};

export type FetchResult<T> = {
  data: T;
  isMock: boolean;
};
