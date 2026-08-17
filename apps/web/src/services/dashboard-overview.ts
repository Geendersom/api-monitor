import type { AlertEvent, DashboardOverview, MonitorWithStatus } from "../types/api.js";
import { countMonitorsByHealth, resolveMonitorHealth } from "./monitor-health.js";

type OverviewContext = Pick<
  DashboardOverview,
  "resolvedIncidents" | "period" | "from" | "to"
>;

export const buildOverviewFromMonitors = (
  monitors: MonitorWithStatus[],
  recentAlerts: AlertEvent[],
  context?: Partial<OverviewContext>,
): DashboardOverview => {
  const healthCounts = countMonitorsByHealth(monitors);
  const monitorsWithUptime = monitors.filter(
    (monitor) => monitor.uptimePercentage !== undefined,
  );
  const monitorsWithResponse = monitors.filter(
    (monitor) =>
      monitor.responseTimeMs !== undefined &&
      resolveMonitorHealth(monitor) !== "offline",
  );

  const overallUptimePercentage =
    monitorsWithUptime.length > 0
      ? monitorsWithUptime.reduce(
          (total, monitor) => total + (monitor.uptimePercentage ?? 0),
          0,
        ) / monitorsWithUptime.length
      : 0;

  const averageResponseTimeMs =
    monitorsWithResponse.length > 0
      ? monitorsWithResponse.reduce(
          (total, monitor) => total + (monitor.responseTimeMs ?? 0),
          0,
        ) / monitorsWithResponse.length
      : 0;

  const now = new Date().toISOString();

  return {
    totalMonitors: monitors.length,
    upMonitors: healthCounts.online,
    downMonitors: healthCounts.offline,
    problemMonitors: healthCounts.problema,
    openIncidents: monitors.filter((monitor) => monitor.hasOpenIncident).length,
    resolvedIncidents: context?.resolvedIncidents ?? 0,
    totalAlerts: recentAlerts.length,
    recentAlerts,
    overallUptimePercentage: Number(overallUptimePercentage.toFixed(2)),
    averageResponseTimeMs: Math.round(averageResponseTimeMs),
    period: context?.period ?? "24h",
    from: context?.from ?? now,
    to: context?.to ?? now,
  };
};
