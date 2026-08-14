import type { AlertEvent } from "../../types/api.js";
import {
  formatAlertType,
  formatRelativeTime,
} from "../../services/formatters.js";

type MonitorAlertsPanelProps = {
  alerts: AlertEvent[];
};

export const MonitorAlertsPanel = ({ alerts }: MonitorAlertsPanelProps) => {
  return (
    <section className="panel" aria-labelledby="monitor-alerts-title">
      <div className="panel__header">
        <div>
          <h2 id="monitor-alerts-title" className="panel__title">
            Alertas
          </h2>
          <p className="panel__subtitle">Eventos recentes deste monitor</p>
        </div>
        <span className="panel__count">{alerts.length}</span>
      </div>

      {alerts.length === 0 ? (
        <p className="panel__empty">Nenhum alerta registrado.</p>
      ) : (
        <ul className="timeline-list">
          {alerts.map((alert) => (
            <li
              key={alert.id}
              className={`timeline-list__item timeline-list__item--${alert.type}`}
            >
              <span
                className={`timeline-list__dot timeline-list__dot--${alert.type}`}
                aria-hidden="true"
              />
              <div className="timeline-list__content">
                <div className="timeline-list__header">
                  <span className="timeline-list__type">
                    {formatAlertType(alert.type)}
                  </span>
                  <time
                    className="timeline-list__time"
                    dateTime={alert.createdAt}
                  >
                    {formatRelativeTime(alert.createdAt)}
                  </time>
                </div>
                <p className="timeline-list__message">{alert.message}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
