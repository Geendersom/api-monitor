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
  onMenuToggle?: () => void;
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
    <div className="page-header monitor-header">
      <div className="page-header__main monitor-header__main">
        {onMenuToggle ? (
          <button
            type="button"
            className="page-header__menu"
            aria-label="Abrir menu"
            onClick={onMenuToggle}
          >
            <span aria-hidden="true" />
            <span aria-hidden="true" />
            <span aria-hidden="true" />
          </button>
        ) : null}
        <div className="monitor-header__content">
          <Link to="/monitors" className="monitor-header__back">
            ← Voltar aos monitores
          </Link>
          <div className="monitor-header__title-row">
            <h1 className="page-header__title">{monitor.name}</h1>
            <StatusIndicator status={status} />
          </div>
          <p className="monitor-header__url">{monitor.url}</p>
          {inMaintenance ? (
            <p className="monitor-header__maintenance">Em manutenção</p>
          ) : null}
        </div>
      </div>

      <div className="page-header__actions">
        {lastUpdatedAt ? (
          <p className="page-header__updated">
            Última atualização: {formatRelativeTime(lastUpdatedAt)}
          </p>
        ) : null}
        <button
          type="button"
          className={`button button--refresh button--compact${refreshing ? " button--refreshing" : ""}`}
          onClick={onRefresh}
          disabled={refreshing}
        >
          {refreshing ? "Atualizando..." : "Atualizar"}
        </button>
      </div>
    </div>
  );
};
