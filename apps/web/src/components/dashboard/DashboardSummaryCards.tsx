import type { ReactNode } from "react";

import type { DashboardOverview } from "../../types/api.js";
import { formatPercentage } from "../../services/formatters.js";

type DashboardSummaryCardsProps = {
  overview: DashboardOverview;
};

const SummaryIcon = ({
  children,
  tone,
}: {
  children: ReactNode;
  tone: "success" | "warning" | "danger" | "neutral";
}) => (
  <span
    className={`dashboard-summary-card__icon dashboard-summary-card__icon--${tone}`}
  >
    {children}
  </span>
);

export const DashboardSummaryCards = ({
  overview,
}: DashboardSummaryCardsProps) => {
  const problemMonitors = overview.problemMonitors ?? 0;
  const onlinePercent =
    overview.totalMonitors > 0
      ? Math.round((overview.upMonitors / overview.totalMonitors) * 1000) / 10
      : 0;
  const problemPercent =
    overview.totalMonitors > 0
      ? Math.round((problemMonitors / overview.totalMonitors) * 1000) / 10
      : 0;
  const offlinePercent =
    overview.totalMonitors > 0
      ? Math.round((overview.downMonitors / overview.totalMonitors) * 1000) / 10
      : 0;

  return (
    <section className="dashboard-summary-grid" aria-label="Resumo geral">
      <article className="dashboard-summary-card">
        <div>
          <p className="dashboard-summary-card__label">Total de APIs</p>
          <p className="dashboard-summary-card__value">{overview.totalMonitors}</p>
          <p className="dashboard-summary-card__hint">APIs monitoradas</p>
        </div>
        <SummaryIcon tone="success">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="4" y="5" width="16" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
            <rect x="4" y="14" width="16" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
          </svg>
        </SummaryIcon>
      </article>

      <article className="dashboard-summary-card">
        <div>
          <p className="dashboard-summary-card__label">Online</p>
          <p className="dashboard-summary-card__value dashboard-summary-card__value--success">
            {overview.upMonitors}
          </p>
          <p className="dashboard-summary-card__hint">{onlinePercent}% do total</p>
        </div>
        <SummaryIcon tone="success">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6" />
            <path d="m8.5 12.2 2.2 2.2 4.8-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </SummaryIcon>
      </article>

      <article className="dashboard-summary-card">
        <div>
          <p className="dashboard-summary-card__label">Com Problemas</p>
          <p className="dashboard-summary-card__value dashboard-summary-card__value--warning">
            {problemMonitors}
          </p>
          <p className="dashboard-summary-card__hint">{problemPercent}% do total</p>
        </div>
        <SummaryIcon tone="warning">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 5.5 19 18H5L12 5.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
            <path d="M12 10v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            <circle cx="12" cy="16.5" r="0.8" fill="currentColor" />
          </svg>
        </SummaryIcon>
      </article>

      <article className="dashboard-summary-card">
        <div>
          <p className="dashboard-summary-card__label">Offline</p>
          <p className="dashboard-summary-card__value dashboard-summary-card__value--danger">
            {overview.downMonitors}
          </p>
          <p className="dashboard-summary-card__hint">{offlinePercent}% do total</p>
        </div>
        <SummaryIcon tone="danger">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6" />
            <path d="M9 9l6 6M15 9l-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </SummaryIcon>
      </article>

      <article className="dashboard-summary-card">
        <div>
          <p className="dashboard-summary-card__label">Uptime Médio</p>
          <p className="dashboard-summary-card__value dashboard-summary-card__value--success">
            {formatPercentage(overview.overallUptimePercentage)}
          </p>
          <p className="dashboard-summary-card__hint">Últimos 30 dias</p>
        </div>
        <SummaryIcon tone="success">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M5 17V7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M9 17V11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M13 17V9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M17 17V13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </SummaryIcon>
      </article>
    </section>
  );
};
