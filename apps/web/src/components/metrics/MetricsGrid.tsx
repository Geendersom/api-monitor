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
  const unknownMonitors =
    overview.totalMonitors - overview.upMonitors - overview.downMonitors;

  const offlineParts = [
    overview.downMonitors > 0 ? `${overview.downMonitors} offline` : null,
    unknownMonitors > 0 ? `${unknownMonitors} sem checks` : null,
  ].filter(Boolean);

  const onlineHint =
    overview.totalMonitors === 0
      ? "Nenhum monitor cadastrado"
      : `${overview.upMonitors} online${offlineParts.length > 0 ? ` · ${offlineParts.join(" · ")}` : ""}`;

  return (
    <section className="metrics-grid" aria-label="Resumo geral">
      <MetricCard
        label="Monitores"
        value={String(overview.totalMonitors)}
        hint={onlineHint}
      />
      <MetricCard
        label="Uptime"
        value={formatPercentage(overview.overallUptimePercentage)}
        hint="Últimas 24 horas"
        tone="accent"
      />
      <MetricCard
        label="Latência média"
        value={formatMilliseconds(overview.averageResponseTimeMs)}
        hint="Últimas 24 horas"
      />
      <MetricCard
        label="Incidentes"
        value={String(overview.openIncidents + overview.resolvedIncidents)}
        hint={
          overview.openIncidents > 0
            ? `${overview.openIncidents} em andamento`
            : "Nenhum em andamento"
        }
        tone={overview.openIncidents > 0 ? "warning" : "default"}
      />
      <MetricCard
        label="Alertas"
        value={String(overview.totalAlerts)}
        hint="Últimos eventos registrados"
      />
    </section>
  );
};
