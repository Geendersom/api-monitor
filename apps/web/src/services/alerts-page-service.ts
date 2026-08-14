import { getMockAlertsAsync, MOCK_MONITOR_NAMES } from "../mocks/index.js";
import type { AlertsPageData, FetchResult } from "../types/api.js";
import { fetchDashboardDataFromApi } from "./dashboard-service.js";
import { resolveWithMockFallback } from "./mock-fallback.js";

const fetchAlertsFromApi = async (): Promise<AlertsPageData> => {
  const dashboard = await fetchDashboardDataFromApi();
  const monitorNames = Object.fromEntries(
    dashboard.monitors.map((monitor) => [monitor.id, monitor.name]),
  );

  return {
    alerts: dashboard.overview.recentAlerts,
    monitorNames,
  };
};

const fetchAlertsFromMock = async (): Promise<AlertsPageData> => ({
  alerts: await getMockAlertsAsync(),
  monitorNames: MOCK_MONITOR_NAMES,
});

export const fetchAlertsPageData = (): Promise<FetchResult<AlertsPageData>> =>
  resolveWithMockFallback(fetchAlertsFromApi, fetchAlertsFromMock);
