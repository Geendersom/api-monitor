import { Link } from "react-router-dom";

import type { MonitorWithStatus } from "../../types/api.js";
import { formatRelativeTime } from "../../services/formatters.js";
import { StatusIndicator } from "../monitors/StatusIndicator.js";

type ActiveIncidentsPanelProps = {
  monitors: MonitorWithStatus[];
  fill?: boolean;
};

export const ActiveIncidentsPanel = ({
  monitors,
  fill = false,
}: ActiveIncidentsPanelProps) => {
  const activeIncidents = monitors.filter(
    (monitor) => monitor.hasOpenIncident && monitor.openIncident,
  );

  return (
    <section
      className={`panel${fill ? " panel--fill" : ""}`}
      aria-labelledby="incidents-title"
    >
      <div className="panel__header">
        <div>
          <h2 id="incidents-title" className="panel__title">
            Active incidents
          </h2>
        </div>
        <span
          className={`panel__count${activeIncidents.length > 0 ? " panel__count--danger" : ""}`}
        >
          {activeIncidents.length}
        </span>
      </div>

      {activeIncidents.length === 0 ? (
        <p className="panel__empty panel__empty--success">
          <span aria-hidden="true">✓ </span>
          No active incidents
        </p>
      ) : (
        <ul className="incident-list">
          {activeIncidents.map((monitor) => {
            const startedAt = monitor.openIncident?.startedAt;
            const reason = monitor.openIncident?.reason;

            return (
              <li key={monitor.id} className="incident-list__item">
                <div className="incident-list__header">
                  <span className="incident-list__name">{monitor.name}</span>
                  <StatusIndicator status="down" />
                </div>
                {startedAt ? (
                  <p className="incident-list__time">
                    Started {formatRelativeTime(startedAt)}
                  </p>
                ) : null}
                {reason ? (
                  <p className="incident-list__meta">{reason}</p>
                ) : null}
                <Link
                  className="incident-list__link"
                  to={`/monitors/${monitor.id}`}
                >
                  View monitor
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};
