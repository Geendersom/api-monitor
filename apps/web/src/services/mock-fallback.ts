import { USE_MOCK_DATA } from "../config/env.js";
import { ApiError } from "../types/api.js";
import type { FetchResult } from "../types/api.js";

/** Em dev, cai para mock quando a API estiver indisponível. */
export const shouldFallbackToMock = (): boolean =>
  USE_MOCK_DATA || import.meta.env.DEV;

export const resolveWithMockFallback = async <T>(
  apiCall: () => Promise<T>,
  mockCall: () => Promise<T>,
): Promise<FetchResult<T>> => {
  if (USE_MOCK_DATA) {
    return { data: await mockCall(), isMock: true };
  }

  try {
    return { data: await apiCall(), isMock: false };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      throw error;
    }

    if (shouldFallbackToMock()) {
      return { data: await mockCall(), isMock: true };
    }

    throw error;
  }
};
