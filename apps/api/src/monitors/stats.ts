import type { CheckResult } from "./history.js";

export type MonitorStats = {
  monitorId: string;
  totalChecks: number;
  successfulChecks: number;
  failedChecks: number;
  uptimePercentage: number;
  averageResponseTimeMs: number;
};

const roundToTwoDecimals = (value: number): number => {
  return Math.round(value * 100) / 100;
};

export const calculateMonitorStats = (
  monitorId: string,
  checks: CheckResult[],
): MonitorStats => {
  const totalChecks = checks.length;
  const successfulChecks = checks.filter(
    (check) => check.status === "up",
  ).length;
  const failedChecks = checks.filter((check) => check.status === "down").length;

  if (totalChecks === 0) {
    return {
      monitorId,
      totalChecks: 0,
      successfulChecks: 0,
      failedChecks: 0,
      uptimePercentage: 0,
      averageResponseTimeMs: 0,
    };
  }

  const totalResponseTimeMs = checks.reduce(
    (sum, check) => sum + check.responseTimeMs,
    0,
  );

  return {
    monitorId,
    totalChecks,
    successfulChecks,
    failedChecks,
    uptimePercentage: roundToTwoDecimals(
      (successfulChecks / totalChecks) * 100,
    ),
    averageResponseTimeMs: roundToTwoDecimals(
      totalResponseTimeMs / totalChecks,
    ),
  };
};
