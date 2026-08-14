import {
  getMockMonitorsAsync,
  getMockMonitorsSummary,
  MOCK_MONITOR_NAMES,
} from "../mocks/index.js";
import type { FetchResult, MonitorsPageData } from "../types/api.js";
import { fetchDashboardDataFromApi } from "./dashboard-service.js";
import { resolveWithMockFallback } from "./mock-fallback.js";

const buildMonitorsPageData = (
  monitors: MonitorsPageData["monitors"],
  summary?: Partial<MonitorsPageData["summary"]>,
): MonitorsPageData => ({
  monitors,
  summary: summary
    ? {
        total: summary.total ?? monitors.length,
        up: summary.up ?? 0,
        down: summary.down ?? 0,
        paused: summary.paused ?? 0,
      }
    : getMockMonitorsSummary(monitors),
});

const fetchMonitorsFromApi = async (): Promise<MonitorsPageData> => {
  const dashboard = await fetchDashboardDataFromApi();
  return buildMonitorsPageData(dashboard.monitors, {
    total: dashboard.overview.totalMonitors,
    up: dashboard.overview.upMonitors,
    down: dashboard.overview.downMonitors,
    paused: dashboard.monitors.filter((monitor) => monitor.paused).length,
  });
};

const fetchMonitorsFromMock = async (): Promise<MonitorsPageData> => {
  const monitors = await getMockMonitorsAsync();
  return buildMonitorsPageData(monitors);
};

export const fetchMonitorsPageData = (): Promise<
  FetchResult<MonitorsPageData>
> => resolveWithMockFallback(fetchMonitorsFromApi, fetchMonitorsFromMock);

export { MOCK_MONITOR_NAMES };
