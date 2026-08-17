import type { MonitorHealth, MonitorWithStatus } from "../types/api.js";

export const resolveMonitorHealth = (
  monitor: MonitorWithStatus,
): MonitorHealth => {
  if (monitor.health) {
    return monitor.health;
  }

  if (monitor.status === "down") {
    return "offline";
  }

  if (monitor.hasWarning || monitor.status === "unknown") {
    return "problema";
  }

  return "online";
};

export const countMonitorsByHealth = (monitors: MonitorWithStatus[]) =>
  monitors.reduce(
    (counts, monitor) => {
      const health = resolveMonitorHealth(monitor);
      counts[health] += 1;
      return counts;
    },
    { online: 0, problema: 0, offline: 0 },
  );
