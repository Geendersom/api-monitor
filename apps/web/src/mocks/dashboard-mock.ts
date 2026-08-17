import type { DashboardData, DashboardOverview } from "../types/api.js";
import { countMonitorsByHealth } from "../services/monitor-health.js";
import { getMockAlerts } from "./alerts-mock.js";
import { getMockMonitors } from "./monitors-mock.js";
import { hoursAgo } from "./time.js";

export { MOCK_MONITOR_IDS, MOCK_MONITOR_NAMES } from "./monitors-mock.js";

const buildOverview = (): DashboardOverview => {
  const monitors = getMockMonitors();
  const healthCounts = countMonitorsByHealth(monitors);

  return {
    totalMonitors: monitors.length,
    upMonitors: healthCounts.online,
    downMonitors: healthCounts.offline,
    problemMonitors: healthCounts.problema,
    openIncidents: monitors.filter((monitor) => monitor.hasOpenIncident).length,
    resolvedIncidents: 3,
    totalAlerts: getMockAlerts().length,
    recentAlerts: getMockAlerts(),
    overallUptimePercentage: 99.42,
    averageResponseTimeMs: 143,
    period: "24h",
    from: hoursAgo(24),
    to: new Date().toISOString(),
  };
};

/** Dados mockados de desenvolvimento — não refletem a API real. */
export const getMockDashboardData = (): DashboardData => ({
  overview: buildOverview(),
  monitors: getMockMonitors(),
});

export const getMockDashboardDataAsync = async (): Promise<DashboardData> => {
  await new Promise((resolve) => setTimeout(resolve, 120));
  return getMockDashboardData();
};
