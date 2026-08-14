import type { AlertEvent } from "../types/api.js";
import { MOCK_MONITOR_IDS } from "./monitors-mock.js";
import { hoursAgo, minutesAgo } from "./time.js";

/** Dados mockados de desenvolvimento — não refletem a API real. */
export const getMockAlerts = (): AlertEvent[] => [
  {
    id: "alert-1",
    monitorId: MOCK_MONITOR_IDS.paymentApi,
    incidentId: "incident-payment-1",
    type: "incident_opened",
    createdAt: minutesAgo(8),
    message: "Payment API went DOWN",
    tone: "down",
  },
  {
    id: "alert-2",
    monitorId: MOCK_MONITOR_IDS.website,
    incidentId: "incident-website-1",
    type: "incident_resolved",
    createdAt: minutesAgo(21),
    message: "Website recovered",
    tone: "recovery",
  },
  {
    id: "alert-3",
    monitorId: MOCK_MONITOR_IDS.apiProduction,
    incidentId: "incident-api-1",
    type: "incident_opened",
    createdAt: hoursAgo(1),
    message: "API latency exceeded 500ms",
    tone: "warning",
  },
  {
    id: "alert-4",
    monitorId: MOCK_MONITOR_IDS.apiProduction,
    incidentId: "incident-api-2",
    type: "incident_resolved",
    createdAt: hoursAgo(2),
    message: "API Production recovered",
    tone: "recovery",
  },
  {
    id: "alert-5",
    monitorId: MOCK_MONITOR_IDS.website,
    incidentId: "incident-website-2",
    type: "incident_opened",
    createdAt: hoursAgo(3),
    message: "Website check failed",
    tone: "down",
  },
  {
    id: "alert-6",
    monitorId: MOCK_MONITOR_IDS.paymentApi,
    incidentId: "incident-payment-2",
    type: "incident_resolved",
    createdAt: hoursAgo(5),
    message: "Payment API recovered",
    tone: "recovery",
  },
  {
    id: "alert-7",
    monitorId: MOCK_MONITOR_IDS.apiProduction,
    incidentId: "incident-api-3",
    type: "incident_opened",
    createdAt: hoursAgo(6),
    message: "Elevated response time detected",
    tone: "warning",
  },
];

export const getMockAlertsAsync = async (): Promise<AlertEvent[]> => {
  await new Promise((resolve) => setTimeout(resolve, 100));
  return getMockAlerts();
};
