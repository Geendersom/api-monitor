import type { MonitorDetailsData, UptimePeriod } from "../types/api.js";
import { MOCK_MONITOR_IDS } from "./monitors-mock.js";
import { hoursAgo, minutesAgo, secondsAgo } from "./time.js";

const periodBounds = (period: UptimePeriod) => {
  const to = new Date().toISOString();
  const hours = period === "24h" ? 24 : period === "7d" ? 24 * 7 : 24 * 30;
  return { from: hoursAgo(hours), to };
};

const MOCK_DETAILS: Record<string, MonitorDetailsData> = {
  [MOCK_MONITOR_IDS.apiProduction]: {
    monitor: {
      id: MOCK_MONITOR_IDS.apiProduction,
      name: "API Production",
      url: "https://api.example.com",
    },
    status: "up",
    lastCheck: {
      id: "check-api-1",
      monitorId: MOCK_MONITOR_IDS.apiProduction,
      status: "up",
      responseTimeMs: 182,
      checkedAt: secondsAgo(12),
      statusCode: 200,
    },
    uptime: {
      monitorId: MOCK_MONITOR_IDS.apiProduction,
      period: "24h",
      ...periodBounds("24h"),
      totalChecks: 1440,
      successfulChecks: 1438,
      failedChecks: 2,
      uptimePercentage: 99.99,
      averageResponseTimeMs: 182,
    },
    sla: {
      monitorId: MOCK_MONITOR_IDS.apiProduction,
      period: "24h",
      ...periodBounds("24h"),
      slaTargetPercentage: 99.9,
      uptimePercentage: 99.99,
      downtimeMs: 8640,
      allowedDowntimeMs: 86400,
      exceededDowntimeMs: 0,
      status: "compliant",
    },
    checks: [
      {
        id: "check-api-1",
        monitorId: MOCK_MONITOR_IDS.apiProduction,
        status: "up",
        responseTimeMs: 182,
        checkedAt: secondsAgo(12),
        statusCode: 200,
      },
      {
        id: "check-api-2",
        monitorId: MOCK_MONITOR_IDS.apiProduction,
        status: "up",
        responseTimeMs: 176,
        checkedAt: secondsAgo(72),
        statusCode: 200,
      },
      {
        id: "check-api-3",
        monitorId: MOCK_MONITOR_IDS.apiProduction,
        status: "down",
        responseTimeMs: 0,
        checkedAt: minutesAgo(45),
        error: "Timeout",
      },
    ],
    incidents: [
      {
        id: "incident-api-resolved",
        monitorId: MOCK_MONITOR_IDS.apiProduction,
        status: "resolved",
        startedAt: hoursAgo(3),
        resolvedAt: hoursAgo(2),
        durationMs: 3_600_000,
        reason: "Elevated latency",
      },
    ],
    maintenance: [],
    activeMaintenance: { active: false, maintenance: null },
    alerts: [
      {
        id: "alert-api-1",
        monitorId: MOCK_MONITOR_IDS.apiProduction,
        incidentId: "incident-api-resolved",
        type: "incident_resolved",
        createdAt: hoursAgo(2),
        message: "API Production recovered",
        tone: "recovery",
      },
    ],
  },
  [MOCK_MONITOR_IDS.website]: {
    monitor: {
      id: MOCK_MONITOR_IDS.website,
      name: "Website",
      url: "https://example.com",
    },
    status: "up",
    lastCheck: {
      id: "check-web-1",
      monitorId: MOCK_MONITOR_IDS.website,
      status: "up",
      responseTimeMs: 91,
      checkedAt: secondsAgo(18),
      statusCode: 200,
    },
    uptime: {
      monitorId: MOCK_MONITOR_IDS.website,
      period: "24h",
      ...periodBounds("24h"),
      totalChecks: 1440,
      successfulChecks: 1440,
      failedChecks: 0,
      uptimePercentage: 100,
      averageResponseTimeMs: 91,
    },
    sla: {
      monitorId: MOCK_MONITOR_IDS.website,
      period: "24h",
      ...periodBounds("24h"),
      slaTargetPercentage: 99.9,
      uptimePercentage: 100,
      downtimeMs: 0,
      allowedDowntimeMs: 86400,
      exceededDowntimeMs: 0,
      status: "compliant",
    },
    checks: [
      {
        id: "check-web-1",
        monitorId: MOCK_MONITOR_IDS.website,
        status: "up",
        responseTimeMs: 91,
        checkedAt: secondsAgo(18),
        statusCode: 200,
      },
    ],
    incidents: [],
    maintenance: [],
    activeMaintenance: { active: false, maintenance: null },
    alerts: [],
  },
  [MOCK_MONITOR_IDS.paymentApi]: {
    monitor: {
      id: MOCK_MONITOR_IDS.paymentApi,
      name: "Payment API",
      url: "https://payments.example.com",
    },
    status: "down",
    lastCheck: {
      id: "check-pay-1",
      monitorId: MOCK_MONITOR_IDS.paymentApi,
      status: "down",
      responseTimeMs: 0,
      checkedAt: secondsAgo(31),
      error: "Connection timeout",
    },
    openIncident: {
      id: "incident-payment-1",
      monitorId: MOCK_MONITOR_IDS.paymentApi,
      status: "open",
      startedAt: minutesAgo(8),
      reason: "Connection timeout",
    },
    uptime: {
      monitorId: MOCK_MONITOR_IDS.paymentApi,
      period: "24h",
      ...periodBounds("24h"),
      totalChecks: 1440,
      successfulChecks: 1403,
      failedChecks: 37,
      uptimePercentage: 97.41,
      averageResponseTimeMs: 312,
    },
    sla: {
      monitorId: MOCK_MONITOR_IDS.paymentApi,
      period: "24h",
      ...periodBounds("24h"),
      slaTargetPercentage: 99.9,
      uptimePercentage: 97.41,
      downtimeMs: 133_056_000,
      allowedDowntimeMs: 86400,
      exceededDowntimeMs: 132_969_600,
      status: "breached",
    },
    checks: [
      {
        id: "check-pay-1",
        monitorId: MOCK_MONITOR_IDS.paymentApi,
        status: "down",
        responseTimeMs: 0,
        checkedAt: secondsAgo(31),
        error: "Connection timeout",
      },
      {
        id: "check-pay-2",
        monitorId: MOCK_MONITOR_IDS.paymentApi,
        status: "down",
        responseTimeMs: 0,
        checkedAt: secondsAgo(91),
        error: "Connection timeout",
      },
    ],
    incidents: [
      {
        id: "incident-payment-1",
        monitorId: MOCK_MONITOR_IDS.paymentApi,
        status: "open",
        startedAt: minutesAgo(8),
        reason: "Connection timeout",
      },
    ],
    maintenance: [],
    activeMaintenance: { active: false, maintenance: null },
    alerts: [
      {
        id: "alert-pay-1",
        monitorId: MOCK_MONITOR_IDS.paymentApi,
        incidentId: "incident-payment-1",
        type: "incident_opened",
        createdAt: minutesAgo(8),
        message: "Payment API went DOWN",
        tone: "down",
      },
    ],
  },
  [MOCK_MONITOR_IDS.authApi]: {
    monitor: {
      id: MOCK_MONITOR_IDS.authApi,
      name: "Authentication API",
      url: "https://auth.example.com",
    },
    status: "up",
    lastCheck: {
      id: "check-auth-1",
      monitorId: MOCK_MONITOR_IDS.authApi,
      status: "up",
      responseTimeMs: 124,
      checkedAt: secondsAgo(24),
      statusCode: 200,
    },
    uptime: {
      monitorId: MOCK_MONITOR_IDS.authApi,
      period: "24h",
      ...periodBounds("24h"),
      totalChecks: 1440,
      successfulChecks: 1440,
      failedChecks: 0,
      uptimePercentage: 99.98,
      averageResponseTimeMs: 124,
    },
    sla: {
      monitorId: MOCK_MONITOR_IDS.authApi,
      period: "24h",
      ...periodBounds("24h"),
      slaTargetPercentage: 99.9,
      uptimePercentage: 99.98,
      downtimeMs: 1728,
      allowedDowntimeMs: 86400,
      exceededDowntimeMs: 0,
      status: "compliant",
    },
    checks: [
      {
        id: "check-auth-1",
        monitorId: MOCK_MONITOR_IDS.authApi,
        status: "up",
        responseTimeMs: 124,
        checkedAt: secondsAgo(24),
        statusCode: 200,
      },
    ],
    incidents: [],
    maintenance: [],
    activeMaintenance: { active: false, maintenance: null },
    alerts: [],
  },
};

const applyPeriod = (
  details: MonitorDetailsData,
  uptimePeriod: UptimePeriod,
  slaPeriod: UptimePeriod,
): MonitorDetailsData => ({
  ...details,
  uptime: {
    ...details.uptime,
    period: uptimePeriod,
    ...periodBounds(uptimePeriod),
  },
  sla: {
    ...details.sla,
    period: slaPeriod,
    ...periodBounds(slaPeriod),
  },
});

export const getMockMonitorDetails = (
  monitorId: string,
  uptimePeriod: UptimePeriod = "24h",
  slaPeriod: UptimePeriod = "24h",
): MonitorDetailsData | null => {
  const details = MOCK_DETAILS[monitorId];
  if (!details) {
    return null;
  }

  return applyPeriod(details, uptimePeriod, slaPeriod);
};

export const getMockMonitorDetailsAsync = async (
  monitorId: string,
  uptimePeriod: UptimePeriod = "24h",
  slaPeriod: UptimePeriod = "24h",
): Promise<MonitorDetailsData | null> => {
  await new Promise((resolve) => setTimeout(resolve, 120));
  return getMockMonitorDetails(monitorId, uptimePeriod, slaPeriod);
};
