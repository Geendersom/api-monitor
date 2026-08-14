import type { MonitorUptime, UptimePeriod } from "../../types/api.js";
import {
  formatMilliseconds,
  formatPercentage,
} from "../../services/formatters.js";
import { PeriodSelector } from "../ui/PeriodSelector.js";

type UptimePanelProps = {
  uptime: MonitorUptime;
  period: UptimePeriod;
  onPeriodChange: (period: UptimePeriod) => void;
};

export const UptimePanel = ({
  uptime,
  period,
  onPeriodChange,
}: UptimePanelProps) => {
  return (
    <section className="panel" aria-labelledby="uptime-title">
      <div className="panel__header">
        <div>
          <h2 id="uptime-title" className="panel__title">
            Uptime
          </h2>
          <p className="panel__subtitle">
            Métricas calculadas pelo backend para o período selecionado
          </p>
        </div>
        <PeriodSelector
          value={period}
          onChange={onPeriodChange}
          label="uptime"
        />
      </div>

      <div className="metrics-grid metrics-grid--compact">
        <MetricCardInline
          label="Uptime"
          value={formatPercentage(uptime.uptimePercentage)}
        />
        <MetricCardInline
          label="Total de checks"
          value={String(uptime.totalChecks)}
        />
        <MetricCardInline
          label="Checks bem-sucedidos"
          value={String(uptime.successfulChecks)}
        />
        <MetricCardInline
          label="Checks com falha"
          value={String(uptime.failedChecks)}
        />
        <MetricCardInline
          label="Tempo médio de resposta"
          value={formatMilliseconds(uptime.averageResponseTimeMs)}
        />
      </div>
    </section>
  );
};

type MetricCardInlineProps = {
  label: string;
  value: string;
};

const MetricCardInline = ({ label, value }: MetricCardInlineProps) => (
  <div className="metric-inline">
    <p className="metric-inline__label">{label}</p>
    <p className="metric-inline__value">{value}</p>
  </div>
);
