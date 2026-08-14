import { Link } from "react-router-dom";

import type { IncidentWithMonitor } from "../../types/api.js";
import {
  formatDateTime,
  formatDuration,
  formatRelativeTime,
} from "../../services/formatters.js";
import { StatusIndicator } from "../monitors/StatusIndicator.js";

type IncidentsPageListProps = {
  active: IncidentWithMonitor[];
  resolved: IncidentWithMonitor[];
};

export const IncidentsPageList = ({
  active,
  resolved,
}: IncidentsPageListProps) => {
  return (
    <div className="incidents-page">
      <section className="panel" aria-labelledby="active-incidents-title">
        <div className="panel__header">
          <h2 id="active-incidents-title" className="panel__title">
            Active incidents
          </h2>
          <span
            className={`panel__count${active.length > 0 ? " panel__count--danger" : ""}`}
          >
            {active.length}
          </span>
        </div>

        {active.length === 0 ? (
          <p className="panel__empty panel__empty--success">
            <span aria-hidden="true">✓ </span>
            No active incidents
          </p>
        ) : (
          <ul className="incident-page-list">
            {active.map((incident) => (
              <li
                key={incident.id}
                className="incident-page-list__item incident-page-list__item--active"
              >
                <div className="incident-page-list__header">
                  <StatusIndicator status="down" />
                  <span className="incident-page-list__monitor">
                    {incident.monitorName}
                  </span>
                </div>
                <p className="incident-page-list__reason">{incident.reason}</p>
                <p className="incident-page-list__meta">
                  Started {formatRelativeTime(incident.startedAt)}
                </p>
                <Link
                  className="incident-list__link"
                  to={`/monitors/${incident.monitorId}`}
                >
                  View monitor
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="panel" aria-labelledby="resolved-incidents-title">
        <div className="panel__header">
          <h2 id="resolved-incidents-title" className="panel__title">
            Resolved
          </h2>
          <span className="panel__count">{resolved.length}</span>
        </div>

        {resolved.length === 0 ? (
          <p className="panel__empty">Nenhum incidente resolvido recente.</p>
        ) : (
          <ul className="incident-page-list">
            {resolved.map((incident) => (
              <li
                key={incident.id}
                className="incident-page-list__item incident-page-list__item--resolved"
              >
                <div className="incident-page-list__header">
                  <span className="incident-page-list__badge incident-page-list__badge--resolved">
                    RESOLVED
                  </span>
                  <span className="incident-page-list__monitor">
                    {incident.monitorName}
                  </span>
                </div>
                <p className="incident-page-list__reason">{incident.reason}</p>
                <p className="incident-page-list__meta">
                  {incident.durationMs
                    ? `Duration ${formatDuration(incident.durationMs)}`
                    : null}
                  {incident.resolvedAt
                    ? ` · Recovered ${formatRelativeTime(incident.resolvedAt)}`
                    : null}
                </p>
                <p className="incident-page-list__time">
                  Started {formatDateTime(incident.startedAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};
