import { formatRelativeTime } from "../../services/dashboard-service.js";

type DashboardHeaderProps = {
  lastUpdatedAt: string | null;
  onRefresh: () => void;
  refreshing: boolean;
  onMenuToggle: () => void;
};

export const DashboardHeader = ({
  lastUpdatedAt,
  onRefresh,
  refreshing,
  onMenuToggle,
}: DashboardHeaderProps) => {
  return (
    <header className="dashboard-header">
      <div className="dashboard-header__main">
        <button
          type="button"
          className="dashboard-header__menu"
          aria-label="Abrir menu"
          onClick={onMenuToggle}
        >
          <span aria-hidden="true" />
          <span aria-hidden="true" />
          <span aria-hidden="true" />
        </button>
        <div>
          <h1 className="dashboard-header__title">Dashboard</h1>
          <p className="dashboard-header__subtitle">
            Visão geral da saúde dos seus monitores.
          </p>
        </div>
      </div>

      <div className="dashboard-header__actions">
        <p className="dashboard-header__updated">
          {lastUpdatedAt
            ? `Atualizado ${formatRelativeTime(lastUpdatedAt)}`
            : "Aguardando primeira atualização"}
        </p>
        <button
          type="button"
          className="button button--secondary button--compact"
          onClick={onRefresh}
          disabled={refreshing}
        >
          {refreshing ? "Atualizando..." : "Atualizar"}
        </button>
      </div>
    </header>
  );
};
