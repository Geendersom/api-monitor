import type { AlertEvent } from "../monitors/alerts.js";
import type { Repositories } from "../repositories/types.js";
import {
  calculateUptimeMetricsFromAggregate,
  type Clock,
  resolvePeriodBounds,
  systemClock,
} from "../monitors/uptime.js";

export const DASHBOARD_UPTIME_PERIOD = "24h" as const;
export const DASHBOARD_RECENT_ALERTS_LIMIT = 10;

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
  period: typeof DASHBOARD_UPTIME_PERIOD;
  from: string;
  to: string;
};

export const countMonitorsByLatestStatus = (
  latestStatuses: Array<{ status: "up" | "down" }>,
): { upMonitors: number; downMonitors: number } => {
  let upMonitors = 0;
  let downMonitors = 0;

  for (const status of latestStatuses) {
    if (status.status === "up") {
      upMonitors += 1;
    } else {
      downMonitors += 1;
    }
  }

  return { upMonitors, downMonitors };
};

export const buildEmptyDashboardOverview = (
  from: string,
  to: string,
): DashboardOverview => ({
  totalMonitors: 0,
  upMonitors: 0,
  downMonitors: 0,
  openIncidents: 0,
  resolvedIncidents: 0,
  totalAlerts: 0,
  recentAlerts: [],
  overallUptimePercentage: 0,
  averageResponseTimeMs: 0,
  period: DASHBOARD_UPTIME_PERIOD,
  from,
  to,
});

export const getDashboardOverview = async (
  repositories: Repositories,
  clock: Clock = systemClock,
): Promise<DashboardOverview> => {
  const now = clock();
  const { from, to } = resolvePeriodBounds(DASHBOARD_UPTIME_PERIOD, now);

  const [
    monitors,
    latestStatuses,
    uptimeAggregate,
    incidentCounts,
    totalAlerts,
    recentAlerts,
  ] = await Promise.all([
    repositories.monitorRepository.findAll(),
    repositories.checkHistoryRepository.getLatestCheckStatusByMonitor(),
    repositories.checkHistoryRepository.getOverallUptimeStats(from, to),
    repositories.incidentRepository.countByStatus(),
    repositories.alertRepository.countAll(),
    repositories.alertRepository.findRecent(DASHBOARD_RECENT_ALERTS_LIMIT),
  ]);

  const { upMonitors, downMonitors } =
    countMonitorsByLatestStatus(latestStatuses);
  const uptimeMetrics = calculateUptimeMetricsFromAggregate(uptimeAggregate);

  return {
    totalMonitors: monitors.length,
    upMonitors,
    downMonitors,
    openIncidents: incidentCounts.open,
    resolvedIncidents: incidentCounts.resolved,
    totalAlerts,
    recentAlerts,
    overallUptimePercentage: uptimeMetrics.uptimePercentage,
    averageResponseTimeMs: uptimeMetrics.averageResponseTimeMs,
    period: DASHBOARD_UPTIME_PERIOD,
    from,
    to,
  };
};
