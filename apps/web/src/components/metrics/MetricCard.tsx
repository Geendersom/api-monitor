type MetricCardProps = {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "success" | "danger" | "warning" | "accent";
};

export const MetricCard = ({
  label,
  value,
  hint,
  tone = "default",
}: MetricCardProps) => {
  return (
    <article className={`metric-card metric-card--${tone}`}>
      <p className="metric-card__label">{label}</p>
      <p className="metric-card__value">{value}</p>
      {hint ? <p className="metric-card__hint">{hint}</p> : null}
    </article>
  );
};
