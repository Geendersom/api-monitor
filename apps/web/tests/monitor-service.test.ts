import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "../src/types/api.js";

const apiRequestMock = vi.fn();

vi.mock("../src/services/api-client.js", () => ({
  apiRequest: (...args: unknown[]) => apiRequestMock(...args),
}));

import { fetchMonitorDetails } from "../src/services/monitor-service.js";

const monitor = {
  id: "monitor-1",
  name: "API Principal",
  url: "https://example.com/health",
};

const uptime = {
  monitorId: "monitor-1",
  period: "24h" as const,
  from: "2026-08-13T12:00:00.000Z",
  to: "2026-08-14T12:00:00.000Z",
  totalChecks: 2,
  successfulChecks: 2,
  failedChecks: 0,
  uptimePercentage: 100,
  averageResponseTimeMs: 120,
};

const sla = {
  monitorId: "monitor-1",
  period: "24h" as const,
  from: "2026-08-13T12:00:00.000Z",
  to: "2026-08-14T12:00:00.000Z",
  slaTargetPercentage: 99.9,
  uptimePercentage: 100,
  downtimeMs: 0,
  allowedDowntimeMs: 86400,
  exceededDowntimeMs: 0,
  status: "compliant" as const,
};

describe("fetchMonitorDetails", () => {
  beforeEach(() => {
    apiRequestMock.mockReset();
  });

  it("loads monitor details from existing API endpoints", async () => {
    apiRequestMock.mockImplementation(async (path: string) => {
      if (path === "/monitors/monitor-1") {
        return monitor;
      }

      if (path === "/monitors/monitor-1/checks") {
        return {
          checks: [
            {
              id: "check-1",
              monitorId: "monitor-1",
              status: "up",
              responseTimeMs: 120,
              checkedAt: "2026-08-14T11:00:00.000Z",
              statusCode: 200,
            },
          ],
        };
      }

      if (path === "/monitors/monitor-1/incidents") {
        return { incidents: [] };
      }

      if (path === "/monitors/monitor-1/uptime?period=24h") {
        return uptime;
      }

      if (path === "/monitors/monitor-1/sla?period=24h") {
        return sla;
      }

      if (path === "/monitors/monitor-1/maintenance") {
        return { maintenance: [] };
      }

      if (path === "/monitors/monitor-1/maintenance/active") {
        return { active: false, maintenance: null };
      }

      if (path === "/monitors/monitor-1/alerts") {
        return { alerts: [] };
      }

      throw new Error(`Unexpected path: ${path}`);
    });

    const details = await fetchMonitorDetails("monitor-1");

    expect(details.monitor).toEqual(monitor);
    expect(details.status).toBe("up");
    expect(details.checks).toHaveLength(1);
    expect(details.uptime.uptimePercentage).toBe(100);
    expect(details.sla.status).toBe("compliant");
  });

  it("requests selected uptime and SLA periods", async () => {
    apiRequestMock.mockImplementation(async (path: string) => {
      if (path === "/monitors/monitor-1") {
        return monitor;
      }

      if (path.endsWith("/checks")) {
        return { checks: [] };
      }

      if (path.endsWith("/incidents")) {
        return { incidents: [] };
      }

      if (path.endsWith("uptime?period=7d")) {
        return { ...uptime, period: "7d" };
      }

      if (path.endsWith("sla?period=30d")) {
        return { ...sla, period: "30d" };
      }

      if (path.endsWith("/maintenance")) {
        return { maintenance: [] };
      }

      if (path.endsWith("/maintenance/active")) {
        return { active: false, maintenance: null };
      }

      if (path.endsWith("/alerts")) {
        return { alerts: [] };
      }

      throw new Error(`Unexpected path: ${path}`);
    });

    const details = await fetchMonitorDetails("monitor-1", "7d", "30d");

    expect(details.uptime.period).toBe("7d");
    expect(details.sla.period).toBe("30d");
    expect(apiRequestMock).toHaveBeenCalledWith(
      "/monitors/monitor-1/uptime?period=7d",
    );
    expect(apiRequestMock).toHaveBeenCalledWith(
      "/monitors/monitor-1/sla?period=30d",
    );
  });

  it("propagates monitor not found errors", async () => {
    apiRequestMock.mockRejectedValue(new ApiError("Monitor not found", 404));

    await expect(fetchMonitorDetails("missing")).rejects.toMatchObject({
      status: 404,
    });
  });
});
