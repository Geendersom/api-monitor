import type { MonitorSla, UptimePeriod } from "../../types/api.js";
import {
  formatMilliseconds,
  formatPercentage,
  formatSlaStatus,
} from "../../services/formatters.js";
import { PeriodSelector } from "../ui/PeriodSelector.js";

type SlaPanelProps = {
  sla: MonitorSla;
  period: UptimePeriod;
  onPeriodChange: (period: UptimePeriod) => void;
};

export const SlaPanel = ({ sla, period, onPeriodChange }: SlaPanelProps) => {
  return (
    <section className="panel" aria-labelledby="sla-title">
      <div className="panel__header">
        <div>
          <h2 id="sla-title" className="panel__title">
            SLA
          </h2>
          <p className="panel__subtitle">
            Avaliação de conformidade fornecida pela API
          </p>
        </div>
        <PeriodSelector value={period} onChange={onPeriodChange} label="SLA" />
      </div>

      <div className="sla-summary">
        <div className="sla-summary__status">
          <span
            className={`sla-badge sla-badge--${sla.status}`}
            aria-label={`Status SLA: ${formatSlaStatus(sla.status)}`}
          >
            {formatSlaStatus(sla.status)}
          </span>
        </div>
        <div className="metrics-grid metrics-grid--compact">
          <MetricCardInline
            label="SLA target"
            value={formatPercentage(sla.slaTargetPercentage)}
          />
          <MetricCardInline
            label="Uptime"
            value={formatPercentage(sla.uptimePercentage)}
          />
          <MetricCardInline
            label="Downtime observado"
            value={formatMilliseconds(sla.downtimeMs)}
          />
          <MetricCardInline
            label="Downtime permitido"
            value={formatMilliseconds(sla.allowedDowntimeMs)}
          />
          <MetricCardInline
            label="Downtime excedido"
            value={formatMilliseconds(sla.exceededDowntimeMs)}
          />
        </div>
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
