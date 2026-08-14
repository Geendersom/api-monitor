type SystemStatusBannerProps = {
  downMonitors: number;
};

export const SystemStatusBanner = ({
  downMonitors,
}: SystemStatusBannerProps) => {
  const isOperational = downMonitors === 0;

  return (
    <section
      className={`system-status system-status--${isOperational ? "operational" : "incident"}`}
      aria-live="polite"
    >
      <div className="system-status__indicator">
        <span className="system-status__dot" aria-hidden="true" />
        <span className="system-status__label">
          {isOperational ? "OPERATIONAL" : "INCIDENT DETECTED"}
        </span>
      </div>
      <p className="system-status__message">
        {isOperational
          ? "Todos os sistemas estão funcionando normalmente."
          : `${downMonitors} monitor${downMonitors > 1 ? "es apresentam" : " apresenta"} falha.`}
      </p>
    </section>
  );
};
