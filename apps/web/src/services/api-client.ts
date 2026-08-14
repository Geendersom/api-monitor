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
    throw new ApiError(
      "Não foi possível conectar à API. Verifique se o backend está em execução.",
      0,
    );
  }

  return parseJson<T>(response);
};
