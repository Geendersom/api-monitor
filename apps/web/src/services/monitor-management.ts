import type {
  CreateMonitorInput,
  Monitor,
  MonitorWithStatus,
} from "../types/api.js";
import { apiRequestJson } from "./api-client.js";
import {
  createDefaultUptimeBars,
  UPTIME_BAR_COUNT_7D,
  UPTIME_BAR_COUNT_30D,
} from "./uptime-bars.js";

const isNonEmptyString = (value: string) => value.trim().length > 0;

const isValidUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

export const validateMonitorForm = (input: CreateMonitorInput): string | null => {
  if (!isNonEmptyString(input.name)) {
    return "Informe um nome para a API.";
  }

  if (!input.url.trim()) {
    return "Informe a URL da API.";
  }

  if (!isValidUrl(input.url)) {
    return "A URL deve ser válida (http:// ou https://).";
  }

  return null;
};

export const createMonitorWithStatus = (
  input: CreateMonitorInput,
  id?: string,
): MonitorWithStatus => ({
  id: id ?? `monitor-${crypto.randomUUID()}`,
  name: input.name.trim(),
  url: input.url,
  status: "up",
  health: "online",
  hasOpenIncident: false,
  paused: false,
  lastCheckedAt: new Date().toISOString(),
  responseTimeMs: 0,
  uptimePercentage: 100,
  uptimeBars7d: createDefaultUptimeBars(UPTIME_BAR_COUNT_7D),
  uptimeBars30d: createDefaultUptimeBars(UPTIME_BAR_COUNT_30D),
});

export const createMonitorOnApi = async (
  input: CreateMonitorInput,
): Promise<Monitor> =>
  apiRequestJson<Monitor>("/monitors", {
    method: "POST",
    body: {
      name: input.name.trim(),
      url: input.url,
    },
  });

export const applyMonitorUpdate = (
  monitor: MonitorWithStatus,
  input: CreateMonitorInput,
): MonitorWithStatus => ({
  ...monitor,
  name: input.name.trim(),
  url: input.url,
});

export const toggleMonitorPaused = (
  monitor: MonitorWithStatus,
): MonitorWithStatus => ({
  ...monitor,
  paused: !monitor.paused,
});
