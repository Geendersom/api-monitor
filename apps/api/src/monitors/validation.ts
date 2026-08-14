import type { CreateMonitorInput } from "./types.js";

type ValidationSuccess = {
  success: true;
  data: CreateMonitorInput;
};

type ValidationFailure = {
  success: false;
  error: string;
};

type ValidationResult = ValidationSuccess | ValidationFailure;

const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === "string" && value.trim().length > 0;
};

const isValidUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

export const validateCreateMonitorBody = (body: unknown): ValidationResult => {
  if (body === null || typeof body !== "object") {
    return { success: false, error: "Request body must be a JSON object" };
  }

  const payload = body as Record<string, unknown>;

  if (!("name" in payload)) {
    return { success: false, error: "name is required" };
  }

  if (!isNonEmptyString(payload.name)) {
    return { success: false, error: "name must be a non-empty string" };
  }

  if (!("url" in payload)) {
    return { success: false, error: "url is required" };
  }

  if (typeof payload.url !== "string") {
    return { success: false, error: "url must be a string" };
  }

  if (!isValidUrl(payload.url)) {
    return { success: false, error: "url must be a valid URL" };
  }

  return {
    success: true,
    data: {
      name: payload.name.trim(),
      url: payload.url,
    },
  };
};
