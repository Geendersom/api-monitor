import type { AlertEvent } from "../../types/api.js";
import {
  formatAlertType,
  formatRelativeTime,
} from "../../services/dashboard-service.js";

type RecentAlertsListProps = {
  alerts: AlertEvent[];
  monitorNames: Record<string, string>;
};

export const RecentAlertsList = ({
  alerts,
  monitorNames,
}: RecentAlertsListProps) => {
  return (
    <section className="panel" aria-labelledby="recent-alerts-title">
      <div className="panel__header">
        <div>
          <h2 id="recent-alerts-title" className="panel__title">
            Alertas recentes
          </h2>
          <p className="panel__subtitle">Linha do tempo compacta de eventos</p>
        </div>
        <span className="panel__count">{alerts.length}</span>
      </div>

      {alerts.length === 0 ? (
        <p className="panel__empty">Nenhum alerta recente.</p>
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
                <p className="timeline-list__monitor">
                  {monitorNames[alert.monitorId] ?? alert.monitorId}
                </p>
                <p className="timeline-list__message">{alert.message}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
