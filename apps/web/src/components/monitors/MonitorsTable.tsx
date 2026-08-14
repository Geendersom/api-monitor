import type { MonitorWithStatus } from "../../types/api.js";
import {
  formatDuration,
  formatRelativeTime,
  formatMilliseconds,
} from "../../services/dashboard-service.js";
import { StatusIndicator } from "./StatusIndicator.js";

type MonitorsTableProps = {
  monitors: MonitorWithStatus[];
};

export const MonitorsTable = ({ monitors }: MonitorsTableProps) => {
  return (
    <section className="panel" aria-labelledby="monitors-title">
      <div className="panel__header">
        <div>
          <h2 id="monitors-title" className="panel__title">
            Status dos monitores
          </h2>
          <p className="panel__subtitle">
            Leitura rápida do estado operacional atual
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
                <th scope="col">Monitor</th>
                <th scope="col">Status</th>
                <th scope="col">Última verificação</th>
                <th scope="col">Tempo de resposta</th>
                <th scope="col">Incidente</th>
              </tr>
            </thead>
            <tbody>
              {monitors.map((monitor) => (
                <tr
                  key={monitor.id}
                  className={
                    monitor.hasOpenIncident ? "data-table__row--highlight" : ""
                  }
                >
                  <td>
                    <div className="monitor-cell">
                      <span className="monitor-cell__name">{monitor.name}</span>
                      <span className="monitor-cell__url">{monitor.url}</span>
                    </div>
                  </td>
                  <td>
                    <StatusIndicator status={monitor.status} />
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
                    {monitor.responseTimeMs !== undefined
                      ? formatMilliseconds(monitor.responseTimeMs)
                      : "—"}
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
                        Nenhum
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
