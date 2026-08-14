import { Link } from "react-router-dom";

import { RecentAlertsList } from "../alerts/RecentAlertsList.js";
import { ActiveIncidentsPanel } from "../incidents/ActiveIncidentsPanel.js";
import { MonitorsTable } from "../monitors/MonitorsTable.js";
import { Modal } from "../ui/Modal.js";
import type { DashboardData } from "../../types/api.js";
import {
  formatMilliseconds,
  formatPercentage,
} from "../../services/formatters.js";

export type DashboardMetricModal =
  "monitors" | "uptime" | "latency" | "incidents" | "alerts" | null;

type DashboardMetricModalsProps = {
  activeModal: DashboardMetricModal;
  data: DashboardData;
  monitorNames: Record<string, string>;
  onClose: () => void;
};

const ModalFooterLink = ({
  to,
  label,
  onClose,
}: {
  to: string;
  label: string;
  onClose: () => void;
}) => (
  <Link className="button button--refresh" to={to} onClick={onClose}>
    {label}
  </Link>
);

export const DashboardMetricModals = ({
  activeModal,
  data,
  monitorNames,
  onClose,
}: DashboardMetricModalsProps) => {
  const { overview, monitors } = data;

  return (
    <>
      <Modal
        open={activeModal === "monitors"}
        title="Monitores"
        subtitle={`${overview.totalMonitors} serviços monitorados`}
        onClose={onClose}
        footer={
          <ModalFooterLink
            to="/monitors"
            label="Abrir página de monitores"
            onClose={onClose}
          />
        }
      >
        <MonitorsTable monitors={monitors} />
      </Modal>

      <Modal
        open={activeModal === "uptime"}
        title="Uptime geral"
        subtitle="Últimas 24 horas"
        onClose={onClose}
        footer={
          <ModalFooterLink
            to="/monitors"
            label="Ver por monitor"
            onClose={onClose}
          />
        }
      >
        <div className="modal-metrics">
          <div className="modal-metric">
            <span className="modal-metric__label">Uptime</span>
            <span className="modal-metric__value modal-metric__value--success">
              {formatPercentage(overview.overallUptimePercentage)}
            </span>
          </div>
          <div className="modal-metric">
            <span className="modal-metric__label">Monitores UP</span>
            <span className="modal-metric__value">
              {overview.upMonitors} / {overview.totalMonitors}
            </span>
          </div>
          <div className="modal-metric">
            <span className="modal-metric__label">Monitores DOWN</span>
            <span className="modal-metric__value modal-metric__value--danger">
              {overview.downMonitors}
            </span>
          </div>
        </div>
        <ul className="modal-list">
          {monitors.map((monitor) => (
            <li key={monitor.id} className="modal-list__item">
              <span>{monitor.name}</span>
              <span>
                {monitor.uptimePercentage !== undefined
                  ? formatPercentage(monitor.uptimePercentage)
                  : "—"}
              </span>
            </li>
          ))}
        </ul>
      </Modal>

      <Modal
        open={activeModal === "latency"}
        title="Latência média"
        subtitle="Últimas 24 horas"
        onClose={onClose}
        footer={
          <ModalFooterLink
            to="/monitors"
            label="Ver monitores"
            onClose={onClose}
          />
        }
      >
        <div className="modal-metrics">
          <div className="modal-metric">
            <span className="modal-metric__label">Média geral</span>
            <span className="modal-metric__value">
              {formatMilliseconds(overview.averageResponseTimeMs)}
            </span>
          </div>
        </div>
        <ul className="modal-list">
          {monitors.map((monitor) => (
            <li key={monitor.id} className="modal-list__item">
              <span>{monitor.name}</span>
              <span>
                {monitor.responseTimeMs !== undefined &&
                monitor.status !== "down"
                  ? formatMilliseconds(monitor.responseTimeMs)
                  : "—"}
              </span>
            </li>
          ))}
        </ul>
      </Modal>

      <Modal
        open={activeModal === "incidents"}
        title="Incidentes"
        subtitle={
          overview.openIncidents > 0
            ? `${overview.openIncidents} em andamento`
            : "Nenhum incidente aberto"
        }
        onClose={onClose}
        footer={
          <ModalFooterLink
            to="/incidents"
            label="Abrir página de incidentes"
            onClose={onClose}
          />
        }
      >
        <ActiveIncidentsPanel monitors={monitors} />
      </Modal>

      <Modal
        open={activeModal === "alerts"}
        title="Alertas recentes"
        subtitle={`${overview.totalAlerts} eventos nas últimas 24h`}
        onClose={onClose}
        footer={
          <ModalFooterLink
            to="/alerts"
            label="Abrir página de alertas"
            onClose={onClose}
          />
        }
      >
        <RecentAlertsList
          alerts={overview.recentAlerts}
          monitorNames={monitorNames}
          fill
        />
      </Modal>
    </>
  );
};
