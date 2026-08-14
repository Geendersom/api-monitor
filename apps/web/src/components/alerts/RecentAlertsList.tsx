import type { AlertEvent, AlertTone } from "../../types/api.js";
import { formatRelativeTime } from "../../services/formatters.js";

type RecentAlertsListProps = {
  alerts: AlertEvent[];
  monitorNames: Record<string, string>;
  fill?: boolean;
};

const resolveAlertTone = (alert: AlertEvent): AlertTone => {
  if (alert.tone) {
    return alert.tone;
  }

  return alert.type === "incident_resolved" ? "recovery" : "down";
};

export const RecentAlertsList = ({
  alerts,
  monitorNames,
  fill = false,
}: RecentAlertsListProps) => {
  return (
    <section
      className={`panel${fill ? " panel--fill" : ""}`}
      aria-labelledby="recent-alerts-title"
    >
      <div className="panel__header">
        <div>
          <h2 id="recent-alerts-title" className="panel__title">
            Recent alerts
          </h2>
        </div>
        <span className="panel__count">{alerts.length}</span>
      </div>

      {alerts.length === 0 ? (
        <p className="panel__empty">Nenhum alerta recente.</p>
      ) : (
        <div className={fill ? "panel__scroll" : undefined}>
          <ul className="timeline-list">
            {alerts.map((alert) => {
              const tone = resolveAlertTone(alert);
              const monitorName =
                monitorNames[alert.monitorId] ?? alert.monitorId;

              return (
                <li
                  key={alert.id}
                  className={`timeline-list__item timeline-list__item--${tone}`}
                >
                  <span
                    className={`timeline-list__dot timeline-list__dot--${tone}`}
                    aria-hidden="true"
                  />
                  <div className="timeline-list__content">
                    <p className="timeline-list__message">
                      {alert.message || `${monitorName} · ${alert.type}`}
                    </p>
                    <time
                      className="timeline-list__time"
                      dateTime={alert.createdAt}
                    >
                      {formatRelativeTime(alert.createdAt)}
                    </time>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
};
