import { randomUUID } from "node:crypto";

export type MaintenanceWindow = {
  id: string;
  monitorId: string;
  title: string;
  reason?: string;
  startsAt: string;
  endsAt: string;
  createdAt: string;
};

export type CreateMaintenanceInput = {
  title: string;
  reason?: string;
  startsAt: string;
  endsAt: string;
};

type ValidationSuccess = {
  success: true;
  data: CreateMaintenanceInput;
};

type ValidationFailure = {
  success: false;
  error: string;
};

type ValidationResult = ValidationSuccess | ValidationFailure;

const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === "string" && value.trim().length > 0;
};

export const parseIsoTimestamp = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
};

export const validateCreateMaintenanceBody = (
  body: unknown,
): ValidationResult => {
  if (body === null || typeof body !== "object") {
    return { success: false, error: "Request body must be a JSON object" };
  }

  const payload = body as Record<string, unknown>;

  if (!("title" in payload)) {
    return { success: false, error: "title is required" };
  }

  if (!isNonEmptyString(payload.title)) {
    return { success: false, error: "title must be a non-empty string" };
  }

  if (!("startsAt" in payload)) {
    return { success: false, error: "startsAt is required" };
  }

  const startsAt = parseIsoTimestamp(payload.startsAt);

  if (!startsAt) {
    return {
      success: false,
      error: "startsAt must be a valid ISO 8601 timestamp",
    };
  }

  if (!("endsAt" in payload)) {
    return { success: false, error: "endsAt is required" };
  }

  const endsAt = parseIsoTimestamp(payload.endsAt);

  if (!endsAt) {
    return {
      success: false,
      error: "endsAt must be a valid ISO 8601 timestamp",
    };
  }

  if (new Date(startsAt).getTime() >= new Date(endsAt).getTime()) {
    return {
      success: false,
      error: "startsAt must be before endsAt",
    };
  }

  const data: CreateMaintenanceInput = {
    title: payload.title.trim(),
    startsAt,
    endsAt,
  };

  if ("reason" in payload && payload.reason !== undefined) {
    if (typeof payload.reason !== "string") {
      return { success: false, error: "reason must be a string" };
    }

    if (payload.reason.trim().length > 0) {
      data.reason = payload.reason.trim();
    }
  }

  return {
    success: true,
    data,
  };
};

/**
 * Verifica se um timestamp está dentro de uma janela de manutenção (limites inclusive).
 */
export const isWithinMaintenanceWindow = (
  timestamp: string,
  maintenance: MaintenanceWindow,
): boolean => {
  const value = new Date(timestamp).getTime();
  const startsAt = new Date(maintenance.startsAt).getTime();
  const endsAt = new Date(maintenance.endsAt).getTime();

  return value >= startsAt && value <= endsAt;
};

/**
 * Verifica sobreposição entre duas janelas.
 * Janelas adjacentes (fim = início) não são consideradas sobrepostas.
 */
export const maintenanceWindowsOverlap = (
  startsAtA: string,
  endsAtA: string,
  startsAtB: string,
  endsAtB: string,
): boolean => {
  return (
    new Date(startsAtA).getTime() < new Date(endsAtB).getTime() &&
    new Date(startsAtB).getTime() < new Date(endsAtA).getTime()
  );
};

export const isMaintenanceActiveAt = (
  timestamp: string,
  windows: MaintenanceWindow[],
): boolean => {
  return windows.some((window) => isWithinMaintenanceWindow(timestamp, window));
};

export const isMaintenanceScheduled = (
  timestamp: string,
  window: MaintenanceWindow,
): boolean => {
  return new Date(timestamp).getTime() < new Date(window.startsAt).getTime();
};

export const isMaintenanceEnded = (
  timestamp: string,
  window: MaintenanceWindow,
): boolean => {
  return new Date(timestamp).getTime() > new Date(window.endsAt).getTime();
};

export const createMaintenanceWindowRecord = (input: {
  monitorId: string;
  title: string;
  reason?: string;
  startsAt: string;
  endsAt: string;
  createdAt?: string;
}): MaintenanceWindow => {
  const window: MaintenanceWindow = {
    id: randomUUID(),
    monitorId: input.monitorId,
    title: input.title,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    createdAt: input.createdAt ?? new Date().toISOString(),
  };

  if (input.reason !== undefined) {
    window.reason = input.reason;
  }

  return window;
};
