import type { AlertEvent } from "../../types/api.js";
import {
  formatAlertType,
  formatDateTime,
} from "../../services/dashboard-service.js";

type RecentAlertsListProps = {
  alerts: AlertEvent[];
};

export const RecentAlertsList = ({ alerts }: RecentAlertsListProps) => {
  return (
    <section className="panel" aria-labelledby="recent-alerts-title">
      <div className="panel__header">
        <div>
          <h2 id="recent-alerts-title" className="panel__title">
            Alertas recentes
          </h2>
          <p className="panel__subtitle">
            Últimos eventos registrados pela API
          </p>
        </div>
        <span className="panel__count">{alerts.length}</span>
      </div>

      {alerts.length === 0 ? (
        <p className="panel__empty">Nenhum alerta recente.</p>
      ) : (
        <ul className="alert-list">
          {alerts.map((alert) => (
            <li
              key={alert.id}
              className={`alert-list__item alert-list__item--${alert.type}`}
            >
              <div className="alert-list__header">
                <span className="alert-list__type">
                  {formatAlertType(alert.type)}
                </span>
                <time className="alert-list__time" dateTime={alert.createdAt}>
                  {formatDateTime(alert.createdAt)}
                </time>
              </div>
              <p className="alert-list__message">{alert.message}</p>
              <p className="alert-list__meta">Monitor {alert.monitorId}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
