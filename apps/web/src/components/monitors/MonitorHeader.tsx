import { Link } from "react-router-dom";

import type { Monitor, MonitorStatus } from "../../types/api.js";
import { formatRelativeTime } from "../../services/formatters.js";
import { StatusIndicator } from "./StatusIndicator.js";

type MonitorHeaderProps = {
  monitor: Monitor;
  status: MonitorStatus;
  lastUpdatedAt: string | null;
  refreshing: boolean;
  onRefresh: () => void;
  onMenuToggle: () => void;
  inMaintenance: boolean;
};

export const MonitorHeader = ({
  monitor,
  status,
  lastUpdatedAt,
  refreshing,
  onRefresh,
  onMenuToggle,
  inMaintenance,
}: MonitorHeaderProps) => {
  return (
    <header className="dashboard-header monitor-header">
      <div className="dashboard-header__main monitor-header__main">
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
        <div className="monitor-header__content">
          <Link to="/" className="monitor-header__back">
            ← Voltar
          </Link>
          <div className="monitor-header__title-row">
            <h1 className="dashboard-header__title">{monitor.name}</h1>
            <StatusIndicator status={status} />
          </div>
          <p className="monitor-header__url">{monitor.url}</p>
          {inMaintenance ? (
            <p className="monitor-header__maintenance">Em manutenção</p>
          ) : null}
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
