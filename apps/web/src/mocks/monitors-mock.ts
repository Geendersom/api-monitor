import type { MonitorWithStatus } from "../types/api.js";
import { minutesAgo, secondsAgo } from "./time.js";
import { createUptimeBars } from "../services/uptime-bars.js";

export const MOCK_MONITOR_IDS = {
  apiProduction: "mock-api-production",
  usersService: "mock-users-service",
  paymentsGateway: "mock-payments-gateway",
  authService: "mock-auth-service",
  notificationsApi: "mock-notifications-api",
  reportsService: "mock-reports-service",
  webhookHandler: "mock-webhook-handler",
  analyticsApi: "mock-analytics-api",
  website: "mock-website",
  paymentApi: "mock-payment-api",
  authApi: "mock-auth-api",
} as const;

export const MOCK_MONITOR_NAMES: Record<string, string> = {
  [MOCK_MONITOR_IDS.apiProduction]: "API de Produção",
  [MOCK_MONITOR_IDS.usersService]: "Usuários Service",
  [MOCK_MONITOR_IDS.paymentsGateway]: "Pagamentos Gateway",
  [MOCK_MONITOR_IDS.authService]: "Auth Service",
  [MOCK_MONITOR_IDS.notificationsApi]: "Notificações API",
  [MOCK_MONITOR_IDS.reportsService]: "Relatórios Service",
  [MOCK_MONITOR_IDS.webhookHandler]: "Webhook Handler",
  [MOCK_MONITOR_IDS.analyticsApi]: "Analytics API",
  [MOCK_MONITOR_IDS.website]: "Website",
  [MOCK_MONITOR_IDS.paymentApi]: "Payment API",
  [MOCK_MONITOR_IDS.authApi]: "Authentication API",
};

/** Dados mockados de desenvolvimento — não refletem a API real. */
export const getMockMonitors = (): MonitorWithStatus[] => [
  {
    id: MOCK_MONITOR_IDS.apiProduction,
    name: "API de Produção",
    url: "https://api.example.com",
    status: "up",
    health: "online",
    hasOpenIncident: false,
    paused: false,
    lastCheckedAt: minutesAgo(1),
    responseTimeMs: 120,
    uptimePercentage: 99.98,
    uptimeBars7d: createUptimeBars(14, [{ index: 11, type: "warning" }]),
    uptimeBars30d: createUptimeBars(30, [
      { index: 8, type: "warning" },
      { index: 22, type: "warning" },
    ]),
  },
  {
    id: MOCK_MONITOR_IDS.usersService,
    name: "Usuários Service",
    url: "https://users.example.com",
    status: "up",
    health: "online",
    hasOpenIncident: false,
    paused: false,
    lastCheckedAt: secondsAgo(45),
    responseTimeMs: 98,
    uptimePercentage: 99.95,
    uptimeBars7d: createUptimeBars(14, []),
    uptimeBars30d: createUptimeBars(30, [{ index: 17, type: "warning" }]),
  },
  {
    id: MOCK_MONITOR_IDS.paymentsGateway,
    name: "Pagamentos Gateway",
    url: "https://payments.example.com",
    status: "up",
    health: "problema",
    hasOpenIncident: false,
    hasWarning: true,
    paused: false,
    lastCheckedAt: secondsAgo(30),
    responseTimeMs: 450,
    uptimePercentage: 98.2,
    uptimeBars7d: createUptimeBars(14, [
      { index: 6, type: "warning" },
      { index: 10, type: "down" },
    ]),
    uptimeBars30d: createUptimeBars(30, [
      { index: 3, type: "warning" },
      { index: 9, type: "down" },
      { index: 18, type: "warning" },
    ]),
  },
  {
    id: MOCK_MONITOR_IDS.authService,
    name: "Auth Service",
    url: "https://auth.example.com",
    status: "up",
    health: "online",
    hasOpenIncident: false,
    paused: false,
    lastCheckedAt: secondsAgo(30),
    responseTimeMs: 85,
    uptimePercentage: 99.99,
    uptimeBars7d: createUptimeBars(14, []),
    uptimeBars30d: createUptimeBars(30, []),
  },
  {
    id: MOCK_MONITOR_IDS.notificationsApi,
    name: "Notificações API",
    url: "https://notifications.example.com",
    status: "up",
    health: "online",
    hasOpenIncident: false,
    paused: false,
    lastCheckedAt: minutesAgo(2),
    responseTimeMs: 110,
    uptimePercentage: 99.91,
    uptimeBars7d: createUptimeBars(14, [{ index: 8, type: "warning" }]),
    uptimeBars30d: createUptimeBars(30, [{ index: 14, type: "warning" }]),
  },
  {
    id: MOCK_MONITOR_IDS.reportsService,
    name: "Relatórios Service",
    url: "https://reports.example.com",
    status: "down",
    health: "offline",
    hasOpenIncident: true,
    paused: false,
    lastCheckedAt: minutesAgo(5),
    uptimePercentage: 95.4,
    openIncident: {
      id: "incident-reports-1",
      startedAt: minutesAgo(12),
      reason: "Service unavailable",
    },
    uptimeBars7d: createUptimeBars(14, [
      { index: 10, type: "down" },
      { index: 11, type: "down" },
      { index: 12, type: "down" },
    ]),
    uptimeBars30d: createUptimeBars(30, [
      { index: 24, type: "down" },
      { index: 25, type: "down" },
      { index: 26, type: "down" },
      { index: 27, type: "down" },
    ]),
  },
  {
    id: MOCK_MONITOR_IDS.webhookHandler,
    name: "Webhook Handler",
    url: "https://webhooks.example.com",
    status: "up",
    health: "online",
    hasOpenIncident: false,
    paused: false,
    lastCheckedAt: secondsAgo(20),
    responseTimeMs: 75,
    uptimePercentage: 99.97,
    uptimeBars7d: createUptimeBars(14, []),
    uptimeBars30d: createUptimeBars(30, []),
  },
  {
    id: MOCK_MONITOR_IDS.analyticsApi,
    name: "Analytics API",
    url: "https://analytics.example.com",
    status: "up",
    health: "online",
    hasOpenIncident: false,
    paused: false,
    lastCheckedAt: minutesAgo(3),
    responseTimeMs: 140,
    uptimePercentage: 99.88,
    uptimeBars7d: createUptimeBars(14, [{ index: 4, type: "warning" }]),
    uptimeBars30d: createUptimeBars(30, [{ index: 11, type: "warning" }]),
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
