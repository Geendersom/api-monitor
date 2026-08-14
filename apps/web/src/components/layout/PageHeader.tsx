import type { ReactNode } from "react";

import { formatRelativeTime } from "../../services/formatters.js";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  lastUpdatedAt?: string | null;
  downMonitors?: number;
  onRefresh?: () => void;
  refreshing?: boolean;
  actions?: ReactNode;
};

export const PageHeader = ({
  title,
  subtitle,
  lastUpdatedAt,
  downMonitors = 0,
  onRefresh,
  refreshing = false,
  actions,
}: PageHeaderProps) => {
  const isOperational = downMonitors === 0;
  const showStatus = downMonitors !== undefined && title === "Dashboard";

  return (
    <div className="page-header">
      <div className="page-header__main">
        <div>
          <h1 className="page-header__title">{title}</h1>
          {subtitle ? (
            <p className="page-header__subtitle">{subtitle}</p>
          ) : null}
        </div>
      </div>

      <div className="page-header__actions">
        {showStatus ? (
          <div className="page-header__status-group">
            <p
              className={`page-header__operational page-header__operational--${isOperational ? "ok" : "down"}`}
            >
              <span
                className="page-header__operational-dot"
                aria-hidden="true"
              />
              {isOperational
                ? "All systems operational"
                : `${downMonitors} system${downMonitors > 1 ? "s" : ""} down`}
            </p>
            {lastUpdatedAt ? (
              <p className="page-header__updated">
                Última atualização: {formatRelativeTime(lastUpdatedAt)}
              </p>
            ) : null}
          </div>
        ) : lastUpdatedAt ? (
          <p className="page-header__updated">
            Última atualização: {formatRelativeTime(lastUpdatedAt)}
          </p>
        ) : null}

        {actions}

        {onRefresh ? (
          <button
            type="button"
            className={`button button--refresh button--compact${refreshing ? " button--refreshing" : ""}`}
            onClick={onRefresh}
            disabled={refreshing}
          >
            {refreshing ? "Atualizando..." : "Atualizar"}
          </button>
        ) : null}
      </div>
    </div>
  );
};
