import { Link } from "react-router-dom";

type MetricCardProps = {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "success" | "danger" | "warning";
  onClick?: () => void;
  to?: string;
  ariaLabel?: string;
};

export const MetricCard = ({
  label,
  value,
  hint,
  tone = "default",
  onClick,
  to,
  ariaLabel,
}: MetricCardProps) => {
  const className = `metric-card metric-card--${tone}${onClick || to ? " metric-card--clickable" : ""}`;
  const content = (
    <>
      <p className="metric-card__label">{label}</p>
      <p className="metric-card__value">{value}</p>
      {hint ? <p className="metric-card__hint">{hint}</p> : null}
      {onClick || to ? (
        <span className="metric-card__action" aria-hidden="true">
          Ver detalhes →
        </span>
      ) : null}
    </>
  );

  if (to) {
    return (
      <Link
        className={className}
        to={to}
        aria-label={ariaLabel ?? `Ver detalhes de ${label}`}
      >
        {content}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button
        type="button"
        className={className}
        onClick={onClick}
        aria-label={ariaLabel ?? `Ver detalhes de ${label}`}
      >
        {content}
      </button>
    );
  }

  return <article className={className}>{content}</article>;
};
