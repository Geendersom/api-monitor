import { DEFAULT_SCHEDULER_INTERVAL_MS } from "./scheduler.js";
import {
  buildMonitorUptime,
  type Clock,
  type UptimePeriod,
  resolvePeriodBounds,
  systemClock,
  type UptimeStatsAggregate,
} from "./uptime.js";

export const DEFAULT_SLA_TARGET_PERCENTAGE = 99.9;

export type SlaStatus = "compliant" | "breached";

export type MonitorSla = {
  monitorId: string;
  period: UptimePeriod;
  from: string;
  to: string;
  slaTargetPercentage: number;
  uptimePercentage: number;
  downtimeMs: number;
  allowedDowntimeMs: number;
  exceededDowntimeMs: number;
  status: SlaStatus;
};

const roundToTwoDecimals = (value: number): number => {
  return Math.round(value * 100) / 100;
};

/**
 * Duração total do período em milissegundos, com base nos limites inclusive.
 */
export const calculatePeriodDurationMs = (from: string, to: string): number => {
  return new Date(to).getTime() - new Date(from).getTime();
};

/**
 * Downtime permitido para cumprir o SLA alvo sobre a duração total do período.
 *
 * Fórmula: periodDurationMs * (100 - slaTargetPercentage) / 100
 */
export const calculateAllowedDowntimeMs = (
  periodDurationMs: number,
  slaTargetPercentage: number = DEFAULT_SLA_TARGET_PERCENTAGE,
): number => {
  return roundToTwoDecimals(
    (periodDurationMs * (100 - slaTargetPercentage)) / 100,
  );
};

/**
 * Downtime observado com base em checks DOWN reais.
 *
 * Convenção documentada: cada check com status "down" representa uma janela
 * de indisponibilidade equivalente ao intervalo padrão de monitoramento
 * (30 segundos). Lacunas sem checks não são tratadas como UP nem DOWN.
 */
export const calculateObservedDowntimeMs = (
  failedChecks: number,
  monitoringIntervalMs: number = DEFAULT_SCHEDULER_INTERVAL_MS,
): number => {
  return failedChecks * monitoringIntervalMs;
};

export const determineSlaStatus = (
  observedDowntimeMs: number,
  allowedDowntimeMs: number,
): SlaStatus => {
  return observedDowntimeMs <= allowedDowntimeMs ? "compliant" : "breached";
};

export const calculateExceededDowntimeMs = (
  observedDowntimeMs: number,
  allowedDowntimeMs: number,
): number => {
  return Math.max(0, observedDowntimeMs - allowedDowntimeMs);
};

export const buildMonitorSla = (
  monitorId: string,
  period: UptimePeriod,
  from: string,
  to: string,
  aggregate: UptimeStatsAggregate,
  slaTargetPercentage: number = DEFAULT_SLA_TARGET_PERCENTAGE,
): MonitorSla => {
  const periodDurationMs = calculatePeriodDurationMs(from, to);
  const allowedDowntimeMs = calculateAllowedDowntimeMs(
    periodDurationMs,
    slaTargetPercentage,
  );
  const uptime = buildMonitorUptime(monitorId, period, from, to, aggregate);
  const downtimeMs = calculateObservedDowntimeMs(aggregate.failedChecks);

  if (aggregate.totalChecks === 0) {
    return {
      monitorId,
      period,
      from,
      to,
      slaTargetPercentage,
      uptimePercentage: 0,
      downtimeMs: 0,
      allowedDowntimeMs,
      exceededDowntimeMs: 0,
      status: "compliant",
    };
  }

  const status = determineSlaStatus(downtimeMs, allowedDowntimeMs);

  return {
    monitorId,
    period,
    from,
    to,
    slaTargetPercentage,
    uptimePercentage: uptime.uptimePercentage,
    downtimeMs,
    allowedDowntimeMs,
    exceededDowntimeMs: calculateExceededDowntimeMs(
      downtimeMs,
      allowedDowntimeMs,
    ),
    status,
  };
};

export const getMonitorSla = async (
  monitorId: string,
  period: UptimePeriod,
  getUptimeStats: (
    monitorId: string,
    from: string,
    to: string,
  ) => Promise<UptimeStatsAggregate>,
  clock: Clock = systemClock,
  slaTargetPercentage: number = DEFAULT_SLA_TARGET_PERCENTAGE,
): Promise<MonitorSla> => {
  const now = clock();
  const { from, to } = resolvePeriodBounds(period, now);
  const aggregate = await getUptimeStats(monitorId, from, to);

  return buildMonitorSla(
    monitorId,
    period,
    from,
    to,
    aggregate,
    slaTargetPercentage,
  );
};
