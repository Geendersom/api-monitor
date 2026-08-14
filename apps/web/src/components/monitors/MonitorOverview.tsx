import type { MonitorDetailsData } from "../../types/api.js";
import {
  formatDateTime,
  formatDuration,
  formatMilliseconds,
  formatPercentage,
  formatRelativeTime,
  formatSlaStatus,
} from "../../services/formatters.js";
import { MetricCard } from "../metrics/MetricCard.js";
import { StatusIndicator } from "./StatusIndicator.js";

type MonitorOverviewProps = {
  data: MonitorDetailsData;
};

export const MonitorOverview = ({ data }: MonitorOverviewProps) => {
  const {
    monitor,
    status,
    lastCheck,
    openIncident,
    uptime,
    sla,
    activeMaintenance,
  } = data;

  return (
    <section className="panel" aria-labelledby="monitor-overview-title">
      <div className="panel__header">
        <div>
          <h2 id="monitor-overview-title" className="panel__title">
            Resumo do monitor
          </h2>
          <p className="panel__subtitle">
            Informações operacionais consolidadas
          </p>
        </div>
        <StatusIndicator status={status} />
      </div>

      <div className="metrics-grid metrics-grid--compact">
        <MetricCard
          label="Status"
          value={status === "unknown" ? "Sem checks" : status.toUpperCase()}
          hint={monitor.url}
        />
        <MetricCard
          label="Último check"
          value={
            lastCheck
              ? formatRelativeTime(lastCheck.checkedAt)
              : "Sem histórico"
          }
          hint={
            lastCheck
              ? formatDateTime(lastCheck.checkedAt)
              : "Aguardando verificação"
          }
        />
        <MetricCard
          label="Tempo de resposta"
          value={lastCheck ? formatMilliseconds(lastCheck.responseTimeMs) : "—"}
          hint="Última verificação"
        />
        <MetricCard
          label={`Uptime ${uptime.period}`}
          value={formatPercentage(uptime.uptimePercentage)}
          hint={`${uptime.totalChecks} checks no período`}
          tone="accent"
        />
        <MetricCard
          label={`SLA ${sla.period}`}
          value={formatSlaStatus(sla.status)}
          hint={`Alvo ${formatPercentage(sla.slaTargetPercentage)}`}
          tone={sla.status === "breached" ? "warning" : "success"}
        />
        <MetricCard
          label="Incidente"
          value={openIncident ? "Aberto" : "Nenhum"}
          hint={
            openIncident
              ? `Desde ${formatDateTime(openIncident.startedAt)} · ${formatDuration(Date.now() - new Date(openIncident.startedAt).getTime())}`
              : "Sem incidentes ativos"
          }
          tone={openIncident ? "warning" : "default"}
        />
      </div>

      {activeMaintenance.active && activeMaintenance.maintenance ? (
        <div className="maintenance-banner" role="status">
          <span className="maintenance-banner__label">Em manutenção</span>
          <span className="maintenance-banner__text">
            {activeMaintenance.maintenance.title}
          </span>
        </div>
      ) : null}
    </section>
  );
};
