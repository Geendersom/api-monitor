import type {
  ActiveMaintenanceResponse,
  MaintenanceWindow,
} from "../../types/api.js";
import {
  formatDateTime,
  getMaintenanceWindowStatus,
} from "../../services/formatters.js";

type MaintenancePanelProps = {
  maintenance: MaintenanceWindow[];
  activeMaintenance: ActiveMaintenanceResponse;
};

const STATUS_LABELS = {
  active: "Ativa",
  upcoming: "Agendada",
  past: "Encerrada",
} as const;

export const MaintenancePanel = ({
  maintenance,
  activeMaintenance,
}: MaintenancePanelProps) => {
  return (
    <section className="panel" aria-labelledby="maintenance-title">
      <div className="panel__header">
        <div>
          <h2 id="maintenance-title" className="panel__title">
            Manutenção
          </h2>
          <p className="panel__subtitle">
            Janelas programadas para este monitor
          </p>
        </div>
        <span className="panel__count">{maintenance.length}</span>
      </div>

      {activeMaintenance.active && activeMaintenance.maintenance ? (
        <div
          className="maintenance-banner maintenance-banner--panel"
          role="status"
        >
          <span className="maintenance-banner__label">Em manutenção</span>
          <span className="maintenance-banner__text">
            {activeMaintenance.maintenance.title}
          </span>
        </div>
      ) : null}

      {maintenance.length === 0 ? (
        <p className="panel__empty">Nenhuma janela de manutenção cadastrada.</p>
      ) : (
        <ul className="maintenance-list">
          {maintenance.map((window) => {
            const status = getMaintenanceWindowStatus(
              window.startsAt,
              window.endsAt,
            );

            return (
              <li key={window.id} className="maintenance-list__item">
                <div className="maintenance-list__header">
                  <span className="maintenance-list__title">
                    {window.title}
                  </span>
                  <span
                    className={`maintenance-list__status maintenance-list__status--${status}`}
                  >
                    {STATUS_LABELS[status]}
                  </span>
                </div>
                {window.reason ? (
                  <p className="maintenance-list__reason">{window.reason}</p>
                ) : null}
                <p className="maintenance-list__meta">
                  Início: {formatDateTime(window.startsAt)}
                </p>
                <p className="maintenance-list__meta">
                  Término: {formatDateTime(window.endsAt)}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};
