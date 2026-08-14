import { useNavigate } from "react-router-dom";

import type { MonitorWithStatus } from "../../types/api.js";
import {
  formatDuration,
  formatRelativeTime,
  formatMilliseconds,
  formatPercentage,
} from "../../services/formatters.js";
import { StatusIndicator } from "./StatusIndicator.js";

type MonitorsTableProps = {
  monitors: MonitorWithStatus[];
};

export const MonitorsTable = ({ monitors }: MonitorsTableProps) => {
  const navigate = useNavigate();

  const openMonitorDetails = (monitorId: string) => {
    void navigate(`/monitors/${monitorId}`);
  };

  return (
    <section className="panel" aria-labelledby="monitors-title">
      <div className="panel__header">
        <div>
          <h2 id="monitors-title" className="panel__title">
            Monitores
          </h2>
          <p className="panel__subtitle">
            Clique em um monitor para ver detalhes completos
          </p>
        </div>
        <span className="panel__count">{monitors.length}</span>
      </div>

      {monitors.length === 0 ? (
        <p className="panel__empty">Nenhum monitor cadastrado.</p>
      ) : (
        <div className="table-wrapper">
          <table className="data-table monitors-table">
            <thead>
              <tr>
                <th scope="col">Status</th>
                <th scope="col">Monitor</th>
                <th scope="col">URL</th>
                <th scope="col">Uptime</th>
                <th scope="col">Latência</th>
                <th scope="col">Último check</th>
                <th scope="col">Incidente</th>
              </tr>
            </thead>
            <tbody>
              {monitors.map((monitor) => (
                <tr
                  key={monitor.id}
                  className={[
                    monitor.status === "down" ? "data-table__row--down" : "",
                    monitor.hasOpenIncident ? "data-table__row--incident" : "",
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
                  <td>
                    <StatusIndicator status={monitor.status} />
                  </td>
                  <td>
                    <span className="monitor-cell__name">{monitor.name}</span>
                  </td>
                  <td>
                    <span className="monitor-cell__url">{monitor.url}</span>
                  </td>
                  <td className="data-table__metric">
                    {monitor.uptimePercentage !== undefined
                      ? formatPercentage(monitor.uptimePercentage)
                      : "—"}
                  </td>
                  <td className="data-table__metric">
                    {monitor.responseTimeMs !== undefined &&
                    monitor.status !== "down"
                      ? formatMilliseconds(monitor.responseTimeMs)
                      : "—"}
                  </td>
                  <td className="data-table__muted">
                    {monitor.lastCheckedAt ? (
                      <time dateTime={monitor.lastCheckedAt}>
                        {formatRelativeTime(monitor.lastCheckedAt)}
                      </time>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    {monitor.hasOpenIncident && monitor.openIncident ? (
                      <span className="incident-pill incident-pill--open">
                        Aberto ·{" "}
                        {formatDuration(
                          Date.now() -
                            new Date(monitor.openIncident.startedAt).getTime(),
                        )}
                      </span>
                    ) : (
                      <span className="incident-pill incident-pill--none">
                        —
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};
