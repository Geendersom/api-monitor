export type HealthCheckUpResult = {
  status: "up";
  statusCode: number;
  responseTimeMs: number;
};

export type HealthCheckDownHttpResult = {
  status: "down";
  statusCode: number;
  responseTimeMs: number;
};

export type HealthCheckDownErrorResult = {
  status: "down";
  responseTimeMs: number;
  error: string;
};

export type HealthCheckResult =
  HealthCheckUpResult | HealthCheckDownHttpResult | HealthCheckDownErrorResult;

export type HealthCheckOptions = {
  timeoutMs?: number;
  fetchFn?: typeof fetch;
};

export const DEFAULT_HEALTH_CHECK_TIMEOUT_MS = 5000;

const getErrorCode = (error: unknown): string | undefined => {
  if (error && typeof error === "object" && "code" in error) {
    const code = (error as NodeJS.ErrnoException).code;
    return typeof code === "string" ? code : undefined;
  }

  return undefined;
};

const getSafeErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    if (error.name === "TimeoutError" || error.name === "AbortError") {
      return "Request timed out";
    }

    const errorCodes = [getErrorCode(error), getErrorCode(error.cause)];
    const connectionErrorCodes = new Set([
      "ECONNREFUSED",
      "ENOTFOUND",
      "EHOSTUNREACH",
      "ECONNRESET",
    ]);

    if (errorCodes.some((code) => code && connectionErrorCodes.has(code))) {
      return "Connection failed";
    }

    if (error.message === "fetch failed") {
      return "Connection failed";
    }
  }

  return "Request failed";
};

export const performHealthCheck = async (
  url: string,
  options: HealthCheckOptions = {},
): Promise<HealthCheckResult> => {
  const timeoutMs = options.timeoutMs ?? DEFAULT_HEALTH_CHECK_TIMEOUT_MS;
  const fetchFn = options.fetchFn ?? fetch;
  const start = performance.now();

  try {
    const response = await fetchFn(url, {
      signal: AbortSignal.timeout(timeoutMs),
    });

    const responseTimeMs = Math.round(performance.now() - start);
    const statusCode = response.status;

    if (statusCode >= 200 && statusCode <= 399) {
      return {
        status: "up",
        statusCode,
        responseTimeMs,
      };
    }

    return {
      status: "down",
      statusCode,
      responseTimeMs,
    };
  } catch (error) {
    return {
      status: "down",
      responseTimeMs: Math.round(performance.now() - start),
      error: getSafeErrorMessage(error),
    };
  }
};
