import type { AlertEvent } from "../types/api.js";

export const formatAlertType = (type: AlertEvent["type"]): string => {
  if (type === "incident_opened") {
    return "Incidente aberto";
  }

  return "Incidente resolvido";
};

export const formatDateTime = (value: string): string => {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(new Date(value));
};

export const formatPercentage = (value: number): string => {
  return `${value.toFixed(2).replace(".", ",")}%`;
};

export const formatMilliseconds = (value: number): string => {
  return `${Math.round(value)} ms`;
};

export const formatRelativeTime = (value: string): string => {
  const target = new Date(value).getTime();
  const diffMs = Date.now() - target;
  const diffSeconds = Math.max(0, Math.round(diffMs / 1000));

  if (diffSeconds < 60) {
    return `há ${diffSeconds}s`;
  }

  const diffMinutes = Math.round(diffSeconds / 60);

  if (diffMinutes < 60) {
    return `há ${diffMinutes} min`;
  }

  const diffHours = Math.round(diffMinutes / 60);

  if (diffHours < 24) {
    return `há ${diffHours} h`;
  }

  const diffDays = Math.round(diffHours / 24);
  return `há ${diffDays} d`;
};

export const formatDuration = (durationMs: number): string => {
  const totalSeconds = Math.max(0, Math.floor(durationMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }

  return `${seconds}s`;
};

export const formatSlaStatus = (status: "compliant" | "breached"): string => {
  return status === "compliant" ? "Compliant" : "Breached";
};

export const formatPeriodLabel = (period: "24h" | "7d" | "30d"): string => {
  if (period === "24h") {
    return "24 horas";
  }

  if (period === "7d") {
    return "7 dias";
  }

  return "30 dias";
};

export const getMaintenanceWindowStatus = (
  startsAt: string,
  endsAt: string,
  now: Date = new Date(),
): "active" | "upcoming" | "past" => {
  const nowMs = now.getTime();
  const startMs = new Date(startsAt).getTime();
  const endMs = new Date(endsAt).getTime();

  if (nowMs >= startMs && nowMs <= endMs) {
    return "active";
  }

  if (nowMs < startMs) {
    return "upcoming";
  }

  return "past";
};
