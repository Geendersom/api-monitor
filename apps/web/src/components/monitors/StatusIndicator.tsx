import type { MonitorStatus } from "../../types/api.js";

type StatusIndicatorProps = {
  status: MonitorStatus;
};

const STATUS_LABELS: Record<MonitorStatus, string> = {
  up: "UP",
  down: "DOWN",
  unknown: "UNKNOWN",
};

export const StatusIndicator = ({ status }: StatusIndicatorProps) => {
  return (
    <span className={`status-indicator status-indicator--${status}`}>
      <span className="status-indicator__dot" aria-hidden="true" />
      <span className="status-indicator__label">{STATUS_LABELS[status]}</span>
    </span>
  );
};
