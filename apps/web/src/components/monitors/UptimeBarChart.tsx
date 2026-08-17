import type { UptimeBarSegment } from "../../types/api.js";

type UptimeBarChartProps = {
  segments: UptimeBarSegment[];
  label: string;
  variant?: "default" | "wide";
};

export const UptimeBarChart = ({
  segments,
  label,
  variant = "default",
}: UptimeBarChartProps) => {
  return (
    <div
      className={`uptime-bar-chart${variant === "wide" ? " uptime-bar-chart--wide" : ""}`}
      role="img"
      aria-label={`${label}: ${segments.filter((segment) => segment === "up").length} de ${segments.length} períodos saudáveis`}
    >
      {segments.map((segment, index) => (
        <span
          key={`${label}-${index}`}
          className={`uptime-bar-chart__bar uptime-bar-chart__bar--${segment}`}
        />
      ))}
    </div>
  );
};
