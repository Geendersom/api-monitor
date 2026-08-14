import type { MonitorWithStatus } from "../../types/api.js";
import {
  formatDateTime,
  formatDuration,
  formatRelativeTime,
} from "../../services/dashboard-service.js";

type ActiveIncidentsPanelProps = {
  monitors: MonitorWithStatus[];
};

export const ActiveIncidentsPanel = ({
  monitors,
}: ActiveIncidentsPanelProps) => {
  const activeIncidents = monitors.filter(
    (monitor) => monitor.hasOpenIncident && monitor.openIncident,
  );

  return (
    <section className="panel" aria-labelledby="incidents-title">
      <div className="panel__header">
        <div>
          <h2 id="incidents-title" className="panel__title">
            Incidentes ativos
          </h2>
          <p className="panel__subtitle">
            Eventos em andamento que exigem atenção
          </p>
        </div>
        <span className="panel__count panel__count--warning">
          {activeIncidents.length}
        </span>
      </div>

      {activeIncidents.length === 0 ? (
        <p className="panel__empty panel__empty--success">
          Nenhum incidente ativo no momento.
        </p>
      ) : (
        <ul className="incident-list">
          {activeIncidents.map((monitor) => {
            const startedAt = monitor.openIncident?.startedAt;
            const durationMs = startedAt
              ? Date.now() - new Date(startedAt).getTime()
              : 0;

            return (
              <li key={monitor.id} className="incident-list__item">
                <div className="incident-list__header">
                  <span className="incident-list__name">{monitor.name}</span>
                  <span className="incident-list__status">Em andamento</span>
                </div>
                {startedAt ? (
                  <>
                    <p className="incident-list__meta">
                      Down desde {formatDateTime(startedAt)}
                    </p>
                    <p className="incident-list__duration">
                      Duração: {formatDuration(durationMs)}
                    </p>
                  </>
                ) : null}
                {monitor.lastCheckedAt ? (
                  <p className="incident-list__time">
                    Último check {formatRelativeTime(monitor.lastCheckedAt)}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};
