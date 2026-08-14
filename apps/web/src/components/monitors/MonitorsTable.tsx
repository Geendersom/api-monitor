import type { MonitorWithStatus } from "../../types/api.js";
import {
  formatDateTime,
  formatMilliseconds,
} from "../../services/dashboard-service.js";
import { StatusBadge } from "./StatusBadge.js";

type MonitorsTableProps = {
  monitors: MonitorWithStatus[];
};

export const MonitorsTable = ({ monitors }: MonitorsTableProps) => {
  return (
    <section className="panel" aria-labelledby="monitors-title">
      <div className="panel__header">
        <div>
          <h2 id="monitors-title" className="panel__title">
            Monitores
          </h2>
          <p className="panel__subtitle">
            Status atual, incidentes abertos e última verificação
          </p>
        </div>
        <span className="panel__count">{monitors.length}</span>
      </div>

      {monitors.length === 0 ? (
        <p className="panel__empty">Nenhum monitor cadastrado.</p>
      ) : (
        <div className="table-wrapper">
          <table className="monitors-table">
            <thead>
              <tr>
                <th scope="col">Monitor</th>
                <th scope="col">Status</th>
                <th scope="col">Incidente</th>
                <th scope="col">Último check</th>
                <th scope="col">Latência</th>
              </tr>
            </thead>
            <tbody>
              {monitors.map((monitor) => (
                <tr
                  key={monitor.id}
                  className={
                    monitor.hasOpenIncident
                      ? "monitors-table__row--incident"
                      : ""
                  }
                >
                  <td>
                    <div className="monitor-cell">
                      <span className="monitor-cell__name">{monitor.name}</span>
                      <span className="monitor-cell__url">{monitor.url}</span>
                    </div>
                  </td>
                  <td>
                    <StatusBadge status={monitor.status} />
                  </td>
                  <td>
                    {monitor.hasOpenIncident ? (
                      <span className="incident-badge">Aberto</span>
                    ) : (
                      <span className="incident-badge incident-badge--none">
                        Nenhum
                      </span>
                    )}
                  </td>
                  <td>
                    {monitor.lastCheckedAt
                      ? formatDateTime(monitor.lastCheckedAt)
                      : "—"}
                  </td>
                  <td>
                    {monitor.responseTimeMs !== undefined
                      ? formatMilliseconds(monitor.responseTimeMs)
                      : "—"}
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
