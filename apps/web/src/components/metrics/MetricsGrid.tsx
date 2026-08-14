import type { DashboardMetricModal } from "../dashboard/DashboardMetricModals.js";
import type { DashboardOverview } from "../../types/api.js";
import {
  formatMilliseconds,
  formatPercentage,
} from "../../services/formatters.js";
import { MetricCard } from "./MetricCard.js";

type MetricsGridProps = {
  overview: DashboardOverview;
  onOpenModal?: (modal: Exclude<DashboardMetricModal, null>) => void;
};

export const MetricsGrid = ({ overview, onOpenModal }: MetricsGridProps) => {
  const monitorHint =
    overview.totalMonitors === 0
      ? "Nenhum monitor cadastrado"
      : `${overview.upMonitors} UP · ${overview.downMonitors} DOWN`;

  return (
    <section className="metrics-grid" aria-label="Resumo geral">
      <MetricCard
        label="Monitores"
        value={String(overview.totalMonitors)}
        hint={monitorHint}
        tone={
          overview.downMonitors > 0
            ? "danger"
            : overview.upMonitors > 0
              ? "success"
              : "default"
        }
        onClick={() => onOpenModal?.("monitors")}
      />
      <MetricCard
        label="Uptime"
        value={formatPercentage(overview.overallUptimePercentage)}
        hint="Últimas 24h"
        tone="success"
        onClick={() => onOpenModal?.("uptime")}
      />
      <MetricCard
        label="Tempo médio"
        value={formatMilliseconds(overview.averageResponseTimeMs)}
        hint="Últimas 24h"
        onClick={() => onOpenModal?.("latency")}
      />
      <MetricCard
        label="Incidentes"
        value={String(overview.openIncidents)}
        hint={
          overview.openIncidents > 0
            ? `${overview.openIncidents} aberto${overview.openIncidents > 1 ? "s" : ""}`
            : "Nenhum aberto"
        }
        tone={overview.openIncidents > 0 ? "danger" : "default"}
        onClick={() => onOpenModal?.("incidents")}
      />
      <MetricCard
        label="Alertas"
        value={String(overview.totalAlerts)}
        hint="Últimas 24h"
        onClick={() => onOpenModal?.("alerts")}
      />
    </section>
  );
};
