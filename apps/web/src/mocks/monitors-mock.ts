import type { MonitorWithStatus } from "../types/api.js";
import { minutesAgo, secondsAgo } from "./time.js";

export const MOCK_MONITOR_IDS = {
  apiProduction: "mock-api-production",
  website: "mock-website",
  paymentApi: "mock-payment-api",
  authApi: "mock-auth-api",
} as const;

export const MOCK_MONITOR_NAMES: Record<string, string> = {
  [MOCK_MONITOR_IDS.apiProduction]: "API Production",
  [MOCK_MONITOR_IDS.website]: "Website",
  [MOCK_MONITOR_IDS.paymentApi]: "Payment API",
  [MOCK_MONITOR_IDS.authApi]: "Authentication API",
};

/** Dados mockados de desenvolvimento — não refletem a API real. */
export const getMockMonitors = (): MonitorWithStatus[] => [
  {
    id: MOCK_MONITOR_IDS.apiProduction,
    name: "API Production",
    url: "https://api.example.com",
    status: "up",
    hasOpenIncident: false,
    paused: false,
    lastCheckedAt: secondsAgo(12),
    responseTimeMs: 182,
    uptimePercentage: 99.99,
  },
  {
    id: MOCK_MONITOR_IDS.website,
    name: "Website",
    url: "https://example.com",
    status: "up",
    hasOpenIncident: false,
    paused: false,
    lastCheckedAt: secondsAgo(18),
    responseTimeMs: 91,
    uptimePercentage: 100,
  },
  {
    id: MOCK_MONITOR_IDS.paymentApi,
    name: "Payment API",
    url: "https://payments.example.com",
    status: "down",
    hasOpenIncident: true,
    paused: false,
    lastCheckedAt: secondsAgo(31),
    uptimePercentage: 97.41,
    openIncident: {
      id: "incident-payment-1",
      startedAt: minutesAgo(8),
      reason: "Connection timeout",
    },
  },
  {
    id: MOCK_MONITOR_IDS.authApi,
    name: "Authentication API",
    url: "https://auth.example.com",
    status: "up",
    hasOpenIncident: false,
    paused: false,
    lastCheckedAt: secondsAgo(24),
    responseTimeMs: 124,
    uptimePercentage: 99.98,
  },
];

export const getMockMonitorsSummary = (monitors: MonitorWithStatus[]) => ({
  total: monitors.length,
  up: monitors.filter((monitor) => monitor.status === "up" && !monitor.paused)
    .length,
  down: monitors.filter((monitor) => monitor.status === "down").length,
  paused: monitors.filter((monitor) => monitor.paused).length,
});

export const getMockMonitorsAsync = async (): Promise<MonitorWithStatus[]> => {
  await new Promise((resolve) => setTimeout(resolve, 120));
  return getMockMonitors();
};
