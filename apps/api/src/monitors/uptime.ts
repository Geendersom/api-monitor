export const UPTIME_PERIODS = ["24h", "7d", "30d"] as const;

export type UptimePeriod = (typeof UPTIME_PERIODS)[number];

export type UptimeStatsAggregate = {
  totalChecks: number;
  successfulChecks: number;
  failedChecks: number;
  averageResponseTimeMs: number;
};

export type MonitorUptime = {
  monitorId: string;
  period: UptimePeriod;
  from: string;
  to: string;
  totalChecks: number;
  successfulChecks: number;
  failedChecks: number;
  uptimePercentage: number;
  averageResponseTimeMs: number;
};

export type Clock = () => Date;

export const systemClock: Clock = () => new Date();

const PERIOD_MS: Record<UptimePeriod, number> = {
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
};

const roundToTwoDecimals = (value: number): number => {
  return Math.round(value * 100) / 100;
};

export const parseUptimePeriod = (value: unknown): UptimePeriod | null => {
  if (typeof value !== "string") {
    return null;
  }

  if ((UPTIME_PERIODS as readonly string[]).includes(value)) {
    return value as UptimePeriod;
  }

  return null;
};

export const resolvePeriodBounds = (
  period: UptimePeriod,
  now: Date,
): { from: string; to: string } => {
  const to = now.toISOString();
  const from = new Date(now.getTime() - PERIOD_MS[period]).toISOString();

  return { from, to };
};

export const buildMonitorUptime = (
  monitorId: string,
  period: UptimePeriod,
  from: string,
  to: string,
  aggregate: UptimeStatsAggregate,
): MonitorUptime => {
  if (aggregate.totalChecks === 0) {
    return {
      monitorId,
      period,
      from,
      to,
      totalChecks: 0,
      successfulChecks: 0,
      failedChecks: 0,
      uptimePercentage: 0,
      averageResponseTimeMs: 0,
    };
  }

  return {
    monitorId,
    period,
    from,
    to,
    totalChecks: aggregate.totalChecks,
    successfulChecks: aggregate.successfulChecks,
    failedChecks: aggregate.failedChecks,
    uptimePercentage: roundToTwoDecimals(
      (aggregate.successfulChecks / aggregate.totalChecks) * 100,
    ),
    averageResponseTimeMs: roundToTwoDecimals(aggregate.averageResponseTimeMs),
  };
};

export const calculateUptimeMetricsFromAggregate = (
  aggregate: UptimeStatsAggregate,
): {
  uptimePercentage: number;
  averageResponseTimeMs: number;
} => {
  if (aggregate.totalChecks === 0) {
    return {
      uptimePercentage: 0,
      averageResponseTimeMs: 0,
    };
  }

  return {
    uptimePercentage: roundToTwoDecimals(
      (aggregate.successfulChecks / aggregate.totalChecks) * 100,
    ),
    averageResponseTimeMs: roundToTwoDecimals(aggregate.averageResponseTimeMs),
  };
};

export const getMonitorUptime = async (
  monitorId: string,
  period: UptimePeriod,
  getUptimeStats: (
    monitorId: string,
    from: string,
    to: string,
  ) => Promise<UptimeStatsAggregate>,
  clock: Clock = systemClock,
): Promise<MonitorUptime> => {
  const now = clock();
  const { from, to } = resolvePeriodBounds(period, now);
  const aggregate = await getUptimeStats(monitorId, from, to);

  return buildMonitorUptime(monitorId, period, from, to, aggregate);
};
