import type { DashboardData, DashboardOverview } from "../types/api.js";
import { getMockAlerts } from "./alerts-mock.js";
import { getMockMonitors } from "./monitors-mock.js";
import { hoursAgo } from "./time.js";

export { MOCK_MONITOR_IDS, MOCK_MONITOR_NAMES } from "./monitors-mock.js";

const buildOverview = (): DashboardOverview => {
  const monitors = getMockMonitors();
  const upMonitors = monitors.filter(
    (monitor) => monitor.status === "up",
  ).length;
  const downMonitors = monitors.filter(
    (monitor) => monitor.status === "down",
  ).length;

  return {
    totalMonitors: monitors.length,
    upMonitors,
    downMonitors,
    openIncidents: 1,
    resolvedIncidents: 3,
    totalAlerts: getMockAlerts().length,
    recentAlerts: getMockAlerts(),
    overallUptimePercentage: 99.97,
    averageResponseTimeMs: 243,
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
