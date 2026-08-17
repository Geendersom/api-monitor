import { ApiError } from "../types/api.js";
import { buildApiUrl } from "../config/api.js";

export const parseJson = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;

    try {
      const body = (await response.json()) as { error?: string };
      if (body.error) {
        message = body.error;
      }
    } catch {
      // Ignore invalid JSON error bodies.
    }

    throw new ApiError(message, response.status);
  }

  return response.json() as Promise<T>;
};

export const apiRequest = async <T>(path: string): Promise<T> => {
  let response: Response;

  try {
    response = await fetch(buildApiUrl(path));
  } catch {
    throw new ApiError("Não foi possível conectar ao backend.", 0);
  }

  return parseJson<T>(response);
};

type ApiRequestJsonOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
};

export const apiRequestJson = async <T>(
  path: string,
  options: ApiRequestJsonOptions = {},
): Promise<T> => {
  let response: Response;

  try {
    const requestInit: RequestInit = {
      method: options.method ?? "GET",
    };

    if (options.body !== undefined) {
      requestInit.headers = { "Content-Type": "application/json" };
      requestInit.body = JSON.stringify(options.body);
    }

    response = await fetch(buildApiUrl(path), requestInit);
  } catch {
    throw new ApiError("Não foi possível conectar ao backend.", 0);
  }

  return parseJson<T>(response);
};
