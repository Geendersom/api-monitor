type ErrorStateProps = {
  message: string;
  onRetry?: () => void;
};

export const ErrorState = ({ message, onRetry }: ErrorStateProps) => {
  return (
    <section className="state-panel state-panel--error" role="alert">
      <p className="state-panel__title">
        Não foi possível carregar a dashboard
      </p>
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
