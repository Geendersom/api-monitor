type ErrorStateProps = {
  title?: string;
  message: string;
  onRetry?: () => void;
};

export const ErrorState = ({
  title = "API unavailable",
  message,
  onRetry,
}: ErrorStateProps) => {
  return (
    <section className="state-panel state-panel--error" role="alert">
      <div
        className="state-panel__icon state-panel__icon--error"
        aria-hidden="true"
      >
        !
      </div>
      <p className="state-panel__title">{title}</p>
      <p className="state-panel__description">{message}</p>
      {onRetry ? (
        <button
          type="button"
          className="button button--refresh"
          onClick={onRetry}
        >
          Tentar novamente
        </button>
      ) : null}
    </section>
  );
};
