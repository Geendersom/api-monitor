import type { UptimePeriod } from "../../types/api.js";
import { UPTIME_PERIODS } from "../../types/api.js";

type PeriodSelectorProps = {
  value: UptimePeriod;
  onChange: (period: UptimePeriod) => void;
  label: string;
};

const PERIOD_LABELS: Record<UptimePeriod, string> = {
  "24h": "24h",
  "7d": "7d",
  "30d": "30d",
};

export const PeriodSelector = ({
  value,
  onChange,
  label,
}: PeriodSelectorProps) => {
  return (
    <div
      className="period-selector"
      role="group"
      aria-label={`Período de ${label}`}
    >
      {UPTIME_PERIODS.map((period) => (
        <button
          key={period}
          type="button"
          className={`period-selector__button${
            value === period ? " period-selector__button--active" : ""
          }`}
          aria-pressed={value === period}
          onClick={() => onChange(period)}
        >
          {PERIOD_LABELS[period]}
        </button>
      ))}
    </div>
  );
};
