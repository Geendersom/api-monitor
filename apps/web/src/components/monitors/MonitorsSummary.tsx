import type { MonitorsPageData } from "../../types/api.js";
import { MetricCard } from "../metrics/MetricCard.js";

type MonitorsSummaryProps = {
  summary: MonitorsPageData["summary"];
};

export const MonitorsSummary = ({ summary }: MonitorsSummaryProps) => {
  return (
    <section className="metrics-grid metrics-grid--summary" aria-label="Resumo">
      <MetricCard label="Total" value={String(summary.total)} />
      <MetricCard label="UP" value={String(summary.up)} tone="success" />
      <MetricCard
        label="DOWN"
        value={String(summary.down)}
        tone={summary.down > 0 ? "danger" : "default"}
      />
      <MetricCard label="Pausados" value={String(summary.paused)} />
    </section>
  );
};
