import type { IncidentWithMonitor } from "../types/api.js";
import { MOCK_MONITOR_IDS, MOCK_MONITOR_NAMES } from "./monitors-mock.js";
import { hoursAgo, minutesAgo } from "./time.js";

/** Dados mockados de desenvolvimento — não refletem a API real. */
export const getMockIncidents = (): {
  active: IncidentWithMonitor[];
  resolved: IncidentWithMonitor[];
} => ({
  active: [
    {
      id: "incident-payment-1",
      monitorId: MOCK_MONITOR_IDS.paymentApi,
      monitorName:
        MOCK_MONITOR_NAMES[MOCK_MONITOR_IDS.paymentApi] ?? "Payment API",
      status: "open",
      startedAt: minutesAgo(8),
      reason: "Connection timeout",
    },
  ],
  resolved: [
    {
      id: "incident-website-1",
      monitorId: MOCK_MONITOR_IDS.website,
      monitorName: MOCK_MONITOR_NAMES[MOCK_MONITOR_IDS.website] ?? "Website",
      status: "resolved",
      startedAt: hoursAgo(2),
      resolvedAt: minutesAgo(21),
      durationMs: 4 * 60_000 + 12_000,
      reason: "HTTP 503",
    },
    {
      id: "incident-api-1",
      monitorId: MOCK_MONITOR_IDS.apiProduction,
      monitorName:
        MOCK_MONITOR_NAMES[MOCK_MONITOR_IDS.apiProduction] ?? "API Production",
      status: "resolved",
      startedAt: hoursAgo(5),
      resolvedAt: hoursAgo(4),
      durationMs: 3_600_000,
      reason: "Elevated latency",
    },
    {
      id: "incident-payment-2",
      monitorId: MOCK_MONITOR_IDS.paymentApi,
      monitorName:
        MOCK_MONITOR_NAMES[MOCK_MONITOR_IDS.paymentApi] ?? "Payment API",
      status: "resolved",
      startedAt: hoursAgo(8),
      resolvedAt: hoursAgo(5),
      durationMs: 3 * 3_600_000,
      reason: "Connection timeout",
    },
  ],
});

export const getMockIncidentsAsync = async () => {
  await new Promise((resolve) => setTimeout(resolve, 100));
  return getMockIncidents();
};
