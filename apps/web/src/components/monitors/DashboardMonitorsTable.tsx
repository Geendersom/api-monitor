import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { resolveMonitorHealth } from "../../services/monitor-health.js";
import type { MonitorWithStatus, UptimeBarSegment } from "../../types/api.js";
import {
  formatMilliseconds,
  formatPercentage,
  formatRelativeTime,
} from "../../services/formatters.js";
import {
  createDefaultUptimeBars,
  UPTIME_BAR_COUNT_7D,
  UPTIME_BAR_COUNT_30D,
} from "../../services/uptime-bars.js";
import { HealthStatusBadge } from "./HealthStatusBadge.js";
import { MonitorActionsMenu } from "./MonitorActionsMenu.js";
import { UptimeBarChart } from "./UptimeBarChart.js";

type DashboardMonitorsTableProps = {
  monitors: MonitorWithStatus[];
  searchQuery: string;
  onEditMonitor: (monitor: MonitorWithStatus) => void;
  onDeleteMonitor: (monitorId: string) => void;
  onTogglePauseMonitor: (monitorId: string) => void;
};

const getMonitorInitial = (name: string) => name.trim().charAt(0).toUpperCase();

const getDefaultBars7d = (): UptimeBarSegment[] =>
  createDefaultUptimeBars(UPTIME_BAR_COUNT_7D);

const getDefaultBars30d = (): UptimeBarSegment[] =>
  createDefaultUptimeBars(UPTIME_BAR_COUNT_30D);

export const DashboardMonitorsTable = ({
  monitors,
  searchQuery,
  onEditMonitor,
  onDeleteMonitor,
  onTogglePauseMonitor,
}: DashboardMonitorsTableProps) => {
  const navigate = useNavigate();

  const filteredMonitors = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return monitors;
    }

    return monitors.filter((monitor) =>
      monitor.name.toLowerCase().includes(query),
    );
  }, [monitors, searchQuery]);

  const isFiltered = searchQuery.trim().length > 0;

  const openMonitorDetails = (monitorId: string) => {
    void navigate(`/monitors/${monitorId}`);
  };

  return (
    <section className="panel dashboard-table-panel" aria-labelledby="apis-title">
      <div className="panel__header">
        <div>
          <h2 id="apis-title" className="panel__title">
            APIs Monitoradas
          </h2>
        </div>
        <span className="panel__count">{filteredMonitors.length}</span>
      </div>

      {filteredMonitors.length === 0 ? (
        <p className="panel__empty">Nenhuma API encontrada para a busca.</p>
      ) : (
        <div className="table-wrapper">
          <table
            className={`data-table dashboard-table${isFiltered ? " dashboard-table--filtered" : ""}`}
          >
            <thead>
              <tr>
                <th scope="col" className="dashboard-table__col-name">
                  Nome
                </th>
                <th scope="col" className="dashboard-table__col-status">
                  Status
                </th>
                <th scope="col" className="dashboard-table__col-uptime">
                  Uptime (24h)
                </th>
                <th scope="col" className="dashboard-table__col-bars">
                  Últimos 7 dias
                </th>
                {isFiltered ? (
                  <th scope="col" className="dashboard-table__col-bars">
                    Últimos 30 dias
                  </th>
                ) : null}
                <th scope="col" className="dashboard-table__col-response">
                  Resposta
                </th>
                <th scope="col" className="dashboard-table__col-checked">
                  Última Verificação
                </th>
                <th scope="col" className="dashboard-table__col-actions">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredMonitors.map((monitor) => {
                const health = resolveMonitorHealth(monitor);
                const bars7d = monitor.uptimeBars7d ?? getDefaultBars7d();
                const bars30d = monitor.uptimeBars30d ?? getDefaultBars30d();

                return (
                  <tr
                    key={monitor.id}
                    className={[
                      health === "offline" ? "data-table__row--down" : "",
                      health === "problema" ? "data-table__row--warning" : "",
                      "data-table__row--clickable",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    tabIndex={0}
                    role="link"
                    aria-label={`Ver detalhes de ${monitor.name}`}
                    onClick={() => openMonitorDetails(monitor.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        openMonitorDetails(monitor.id);
                      }
                    }}
                  >
                    <td className="dashboard-table__col-name">
                      <div className="monitor-name-cell">
                        <span
                          className={`monitor-name-cell__avatar monitor-name-cell__avatar--${health}`}
                          aria-hidden="true"
                        >
                          {getMonitorInitial(monitor.name)}
                        </span>
                        <span className="monitor-name-cell__name">
                          {monitor.name}
                        </span>
                      </div>
                    </td>
                    <td className="dashboard-table__col-status">
                      <HealthStatusBadge health={health} />
                    </td>
                    <td className="dashboard-table__col-uptime data-table__metric">
                      {monitor.uptimePercentage !== undefined
                        ? formatPercentage(monitor.uptimePercentage)
                        : "—"}
                    </td>
                    <td className="dashboard-table__col-bars">
                      <UptimeBarChart
                        segments={bars7d}
                        label="Últimos 7 dias"
                        variant="wide"
                      />
                    </td>
                    {isFiltered ? (
                      <td className="dashboard-table__col-bars">
                        <UptimeBarChart
                          segments={bars30d}
                          label="Últimos 30 dias"
                        />
                      </td>
                    ) : null}
                    <td className="dashboard-table__col-response data-table__metric">
                      {monitor.responseTimeMs !== undefined &&
                      health !== "offline"
                        ? formatMilliseconds(monitor.responseTimeMs)
                        : "—"}
                    </td>
                    <td className="dashboard-table__col-checked data-table__muted">
                      {monitor.lastCheckedAt ? (
                        <time dateTime={monitor.lastCheckedAt}>
                          {formatRelativeTime(monitor.lastCheckedAt)}
                        </time>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="dashboard-table__col-actions">
                      <div
                        className="table-actions"
                        onClick={(event) => event.stopPropagation()}
                        onKeyDown={(event) => event.stopPropagation()}
                      >
                        <button
                          type="button"
                          className="table-actions__button"
                          title="Ver detalhes"
                          aria-label={`Ver detalhes de ${monitor.name}`}
                          onClick={() => openMonitorDetails(monitor.id)}
                        >
                          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                            <path
                              d="M5 14V6"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                            />
                            <path
                              d="M9 14V9"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                            />
                            <path
                              d="M13 14V11"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                            />
                          </svg>
                        </button>
                        <button
                          type="button"
                          className="table-actions__button"
                          title="Editar monitor"
                          aria-label={`Editar ${monitor.name}`}
                          onClick={() => onEditMonitor(monitor)}
                        >
                          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                            <path
                              d="M12.2 4.8 15.2 7.8 7.5 15.5 4.5 15.5 4.5 12.5 12.2 4.8Z"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                        <MonitorActionsMenu
                          monitor={monitor}
                          onViewDetails={openMonitorDetails}
                          onEdit={onEditMonitor}
                          onTogglePause={onTogglePauseMonitor}
                          onDelete={onDeleteMonitor}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};
