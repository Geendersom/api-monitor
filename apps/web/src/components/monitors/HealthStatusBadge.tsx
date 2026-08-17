import type { MonitorHealth } from "../../types/api.js";

type HealthStatusBadgeProps = {
  health: MonitorHealth;
};

const HEALTH_LABELS: Record<MonitorHealth, string> = {
  online: "Online",
  problema: "Problema",
  offline: "Offline",
};

export const HealthStatusBadge = ({ health }: HealthStatusBadgeProps) => {
  return (
    <span className={`health-badge health-badge--${health}`}>
      {HEALTH_LABELS[health]}
    </span>
  );
};
