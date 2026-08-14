import type { Incident } from "../../types/api.js";
import { formatDateTime, formatDuration } from "../../services/formatters.js";

type MonitorIncidentsPanelProps = {
  incidents: Incident[];
};

export const MonitorIncidentsPanel = ({
  incidents,
}: MonitorIncidentsPanelProps) => {
  const openIncidents = incidents.filter(
    (incident) => incident.status === "open",
  );
  const resolvedIncidents = incidents.filter(
    (incident) => incident.status === "resolved",
  );

  return (
    <section className="panel" aria-labelledby="monitor-incidents-title">
      <div className="panel__header">
        <div>
          <h2 id="monitor-incidents-title" className="panel__title">
            Incidentes
          </h2>
          <p className="panel__subtitle">
            Abertos e resolvidos relacionados a este monitor
          </p>
        </div>
        <span className="panel__count">{incidents.length}</span>
      </div>

      {incidents.length === 0 ? (
        <p className="panel__empty">Nenhum incidente registrado.</p>
      ) : (
        <div className="incident-sections">
          <IncidentGroup
            title="Incidentes abertos"
            incidents={openIncidents}
            tone="open"
            emptyMessage="Nenhum incidente aberto."
          />
          <IncidentGroup
            title="Incidentes resolvidos"
            incidents={resolvedIncidents}
            tone="resolved"
            emptyMessage="Nenhum incidente resolvido."
          />
        </div>
      )}
    </section>
  );
};

type IncidentGroupProps = {
  title: string;
  incidents: Incident[];
  tone: "open" | "resolved";
  emptyMessage: string;
};

const IncidentGroup = ({
  title,
  incidents,
  tone,
  emptyMessage,
}: IncidentGroupProps) => (
  <div className="incident-group">
    <h3 className="incident-group__title">{title}</h3>
    {incidents.length === 0 ? (
      <p className="incident-group__empty">{emptyMessage}</p>
    ) : (
      <ul className="incident-list">
        {incidents.map((incident) => (
          <li
            key={incident.id}
            className={`incident-list__item incident-list__item--${tone}`}
          >
            <div className="incident-list__header">
              <span className="incident-list__name">
                {incident.status === "open" ? "Em andamento" : "Resolvido"}
              </span>
              <span className="incident-list__status">
                {incident.status === "open" ? "Aberto" : "Encerrado"}
              </span>
            </div>
            <p className="incident-list__meta">
              Início: {formatDateTime(incident.startedAt)}
            </p>
            {incident.resolvedAt ? (
              <p className="incident-list__meta">
                Resolução: {formatDateTime(incident.resolvedAt)}
              </p>
            ) : null}
            {incident.durationMs !== undefined ? (
              <p className="incident-list__duration">
                Duração: {formatDuration(incident.durationMs)}
              </p>
            ) : incident.status === "open" ? (
              <p className="incident-list__duration">
                Duração:{" "}
                {formatDuration(
                  Date.now() - new Date(incident.startedAt).getTime(),
                )}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    )}
  </div>
);
