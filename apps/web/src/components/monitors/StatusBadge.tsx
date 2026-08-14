import type { MonitorStatus } from "../../types/api.js";

type StatusBadgeProps = {
  status: MonitorStatus;
  label?: string;
};

const STATUS_LABELS: Record<MonitorStatus, string> = {
  up: "UP",
  down: "DOWN",
  unknown: "Sem checks",
};

export const StatusBadge = ({ status, label }: StatusBadgeProps) => {
  const text = label ?? STATUS_LABELS[status];

  return <span className={`status-badge status-badge--${status}`}>{text}</span>;
};
