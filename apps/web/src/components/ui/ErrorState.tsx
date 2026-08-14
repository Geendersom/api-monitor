type ErrorStateProps = {
  message: string;
  onRetry?: () => void;
};

export const ErrorState = ({ message, onRetry }: ErrorStateProps) => {
  return (
    <section className="state-panel state-panel--error" role="alert">
      <div
        className="state-panel__icon state-panel__icon--error"
        aria-hidden="true"
      >
        !
      </div>
      <p className="state-panel__title">Falha ao carregar a dashboard</p>
      <p className="state-panel__description">{message}</p>
      {onRetry ? (
        <button
          type="button"
          className="button button--primary"
          onClick={onRetry}
        >
          Tentar novamente
        </button>
      ) : null}
    </section>
  );
};
