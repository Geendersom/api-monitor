import type { DashboardOverview } from "../../types/api.js";
import {
  formatMilliseconds,
  formatPercentage,
} from "../../services/dashboard-service.js";
import { MetricCard } from "./MetricCard.js";

type MetricsGridProps = {
  overview: DashboardOverview;
};

export const MetricsGrid = ({ overview }: MetricsGridProps) => {
  return (
    <section className="metrics-grid" aria-label="Métricas principais">
      <MetricCard
        label="Total de monitores"
        value={String(overview.totalMonitors)}
      />
      <MetricCard
        label="Monitores UP"
        value={String(overview.upMonitors)}
        tone="success"
      />
      <MetricCard
        label="Monitores DOWN"
        value={String(overview.downMonitors)}
        tone="danger"
      />
      <MetricCard
        label="Incidentes abertos"
        value={String(overview.openIncidents)}
        tone={overview.openIncidents > 0 ? "warning" : "default"}
        hint={
          overview.openIncidents > 0
            ? "Requer atenção imediata"
            : "Nenhum incidente ativo"
        }
      />
      <MetricCard
        label="Uptime 24h"
        value={formatPercentage(overview.overallUptimePercentage)}
        tone="accent"
        hint={`Período ${overview.period}`}
      />
      <MetricCard
        label="Latência média 24h"
        value={formatMilliseconds(overview.averageResponseTimeMs)}
        hint="Todos os monitores"
      />
      <MetricCard
        label="Total de alertas"
        value={String(overview.totalAlerts)}
      />
    </section>
  );
};
