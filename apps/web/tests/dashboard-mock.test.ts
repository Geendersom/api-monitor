import { describe, expect, it } from "vitest";

import { USE_MOCK_DATA } from "../src/config/env.js";
import {
  getMockAlerts,
  getMockDashboardData,
  getMockIncidents,
  getMockMonitors,
  getMockMonitorsSummary,
  getMockSettings,
  MOCK_MONITOR_IDS,
} from "../src/mocks/index.js";
import { getMockMonitorDetails } from "../src/mocks/monitor-mock.js";

describe("centralized mock data", () => {
  it("provides dashboard overview values", () => {
    const data = getMockDashboardData();

    expect(data.overview.totalMonitors).toBe(4);
    expect(data.overview.upMonitors).toBe(3);
    expect(data.overview.downMonitors).toBe(1);
    expect(data.overview.overallUptimePercentage).toBe(99.97);
    expect(data.overview.totalAlerts).toBe(7);
  });

  it("includes four monitors with mixed status", () => {
    const monitors = getMockMonitors();
    const summary = getMockMonitorsSummary(monitors);

    expect(monitors).toHaveLength(4);
    expect(summary.up).toBe(3);
    expect(summary.down).toBe(1);

    const downMonitor = monitors.find(
      (monitor) => monitor.id === MOCK_MONITOR_IDS.paymentApi,
    );
    expect(downMonitor?.status).toBe("down");
  });

  it("provides incidents, alerts and settings mocks", () => {
    const incidents = getMockIncidents();
    expect(incidents.active).toHaveLength(1);
    expect(incidents.resolved.length).toBeGreaterThan(0);
    expect(getMockAlerts()).toHaveLength(7);
    expect(getMockSettings().system.appName).toBe("API Monitor");
  });

  it("exposes monitor details for mock ids", () => {
    const details = getMockMonitorDetails(MOCK_MONITOR_IDS.paymentApi);

    expect(details?.status).toBe("down");
    expect(details?.openIncident?.reason).toBe("Connection timeout");
  });
});

describe("mock config", () => {
  it("reads USE_MOCK_DATA from env", () => {
    expect(typeof USE_MOCK_DATA).toBe("boolean");
  });
});
